import pretty from 'pretty';

export default function formatHtml(minifiedHtml: string) {
  const formattedHtml = pretty(minifiedHtml);

  return formattedHtml;
}
