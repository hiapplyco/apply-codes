import ReportWrapper from './wrapper';

export const revalidate = 0;

export async function generateStaticParams() {
  return [];
}

export default function ReportPage() {
  return <ReportWrapper />;
}
