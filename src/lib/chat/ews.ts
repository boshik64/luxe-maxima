import https from "node:https";
import { URL } from "node:url";
import httpntlm from "httpntlm";

export type EwsItemRef = { id: string; changeKey: string };

function ewsUrl() {
  return process.env.EWS_URL?.trim() ?? "";
}

function ewsUser() {
  return process.env.EWS_USER?.trim() ?? "";
}

function ewsPassword() {
  return process.env.EWS_PASSWORD ?? "";
}

function tlsInsecure() {
  return process.env.EWS_TLS_INSECURE === "1";
}

export function ewsConfigured() {
  return Boolean(ewsUrl() && ewsUser() && ewsPassword());
}

function envelope(body: string) {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types"
  xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages">
  <soap:Header>
    <t:RequestServerVersion Version="Exchange2013"/>
  </soap:Header>
  <soap:Body>
${body}
  </soap:Body>
</soap:Envelope>`;
}

function parseDomainUser(user: string): { username: string; domain: string; workstation: string } {
  if (user.includes("\\")) {
    const [domain, username] = user.split("\\");
    return { username, domain, workstation: "" };
  }
  return { username: user, domain: "", workstation: "" };
}

function postBasic(urlString: string, xml: string): Promise<{ status: number; body: string }> {
  const url = new URL(urlString);
  const auth = Buffer.from(`${ewsUser()}:${ewsPassword()}`, "utf8").toString("base64");
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "Content-Length": Buffer.byteLength(xml),
          Authorization: `Basic ${auth}`,
        },
        rejectUnauthorized: !tlsInsecure(),
        timeout: 20_000,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        response.on("end", () => {
          resolve({
            status: response.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    request.on("timeout", () => {
      request.destroy(new Error("EWS Basic request timed out"));
    });
    request.on("error", reject);
    request.write(xml);
    request.end();
  });
}

function postNtlm(url: string, xml: string): Promise<{ status: number; body: string }> {
  const { username, domain, workstation } = parseDomainUser(ewsUser());
  return new Promise((resolve, reject) => {
    httpntlm.post(
      {
        url,
        username,
        password: ewsPassword(),
        domain,
        workstation,
        body: xml,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
        rejectUnauthorized: !tlsInsecure(),
        timeout: 20_000,
      },
      (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({
          status: response.statusCode ?? 0,
          body: typeof response.body === "string" ? response.body : String(response.body ?? ""),
        });
      },
    );
  });
}

async function ewsSoap(bodyXml: string): Promise<string> {
  const url = ewsUrl();
  const xml = envelope(bodyXml);
  const authMode = process.env.EWS_AUTH?.trim().toLowerCase();

  if (authMode !== "ntlm") {
    try {
      const basic = await postBasic(url, xml);
      if (basic.status >= 200 && basic.status < 300) return basic.body;
      if (basic.status !== 401 || authMode === "basic") {
        throw new Error(`EWS HTTP ${basic.status}: ${basic.body.slice(0, 300)}`);
      }
    } catch (error) {
      if (authMode === "basic") throw error;
    }
  }

  const ntlm = await postNtlm(url, xml);
  if (ntlm.status < 200 || ntlm.status >= 300) {
    throw new Error(`EWS NTLM HTTP ${ntlm.status}: ${ntlm.body.slice(0, 300)}`);
  }
  return ntlm.body;
}

function decodeXml(text: string) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export function parseItemRefs(xml: string): EwsItemRef[] {
  const refs: EwsItemRef[] = [];
  const re = /<(?:t:)?ItemId\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) {
    const attrs = match[1] ?? "";
    const id = attrs.match(/\bId="([^"]+)"/i)?.[1];
    const changeKey = attrs.match(/\bChangeKey="([^"]+)"/i)?.[1];
    if (id && changeKey) refs.push({ id, changeKey });
  }
  return refs;
}

export function parseMimeContent(xml: string): Buffer | null {
  const match = xml.match(/<(?:t:)?MimeContent\b[^>]*>([^<]*)<\/(?:t:)?MimeContent>/i);
  if (!match?.[1]) return null;
  return Buffer.from(match[1].trim(), "base64");
}

export async function findUnreadInboxItems(limit = 25): Promise<EwsItemRef[]> {
  const xml = await ewsSoap(`    <m:FindItem Traversal="Shallow">
      <m:ItemShape>
        <t:BaseShape>IdOnly</t:BaseShape>
      </m:ItemShape>
      <m:IndexedPageItemView MaxEntriesReturned="${limit}" Offset="0" BasePoint="Beginning"/>
      <m:Restriction>
        <t:IsEqualTo>
          <t:FieldURI FieldURI="message:IsRead"/>
          <t:FieldURIOrConstant>
            <t:Constant Value="false"/>
          </t:FieldURIOrConstant>
        </t:IsEqualTo>
      </m:Restriction>
      <m:ParentFolderIds>
        <t:DistinguishedFolderId Id="inbox"/>
      </m:ParentFolderIds>
    </m:FindItem>`);
  if (/ResponseClass="Error"/i.test(xml)) {
    throw new Error(`EWS FindItem error: ${decodeXml(xml).slice(0, 400)}`);
  }
  return parseItemRefs(xml);
}

export async function getItemMime(ref: EwsItemRef): Promise<Buffer | null> {
  const xml = await ewsSoap(`    <m:GetItem>
      <m:ItemShape>
        <t:BaseShape>IdOnly</t:BaseShape>
        <t:IncludeMimeContent>true</t:IncludeMimeContent>
      </m:ItemShape>
      <m:ItemIds>
        <t:ItemId Id="${ref.id}" ChangeKey="${ref.changeKey}"/>
      </m:ItemIds>
    </m:GetItem>`);
  if (/ResponseClass="Error"/i.test(xml)) {
    throw new Error(`EWS GetItem error: ${decodeXml(xml).slice(0, 400)}`);
  }
  return parseMimeContent(xml);
}

export async function markItemRead(ref: EwsItemRef): Promise<void> {
  const xml = await ewsSoap(`    <m:UpdateItem MessageDisposition="SaveOnly" ConflictResolution="AlwaysOverwrite">
      <m:ItemChanges>
        <t:ItemChange>
          <t:ItemId Id="${ref.id}" ChangeKey="${ref.changeKey}"/>
          <t:Updates>
            <t:SetItemField>
              <t:FieldURI FieldURI="message:IsRead"/>
              <t:Message>
                <t:IsRead>true</t:IsRead>
              </t:Message>
            </t:SetItemField>
          </t:Updates>
        </t:ItemChange>
      </m:ItemChanges>
    </m:UpdateItem>`);
  if (/ResponseClass="Error"/i.test(xml)) {
    throw new Error(`EWS UpdateItem error: ${decodeXml(xml).slice(0, 400)}`);
  }
}
