export class ApplicationValidationError extends Error {
  constructor(public fields: Record<string, string>) {
    super("Проверьте поля формы");
  }
}
