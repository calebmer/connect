declare module "postgres-date" {
  export default function parseDate(isoDate: string): Date | null;
}
