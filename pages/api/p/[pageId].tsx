import Replace from 'interfaces/Replace';
import { NextApiRequest, NextApiResponse } from 'next';
import PageDataService from 'services/page-data-service';
import urlParser from 'url-parse';

function filterHtml(html: string) {
  const urlFilter = new RegExp(
    // Regex to find urls stolen from url-finder on npm
    /(url\s*\(\s*['"]?\s*)([\w\-\/\.:@&%?]+)(\s*['"]?\s*\))|((href|src)\s*=\s*["']\s*)([\w\-\/\.:@&%?]+)(\s*["'])/,
    'g'
  );
  const tagFilter = new RegExp(
    // Simple regex to remove malicious tags completely, to be improved
    /<(script|meta|body|head|style).*?(\/)?.*?>(.*?<\/\1>)?/,
    'gs'
  );

  let urlFilteredHtml = html;
  let urls: RegExpExecArray;

  while ((urls = urlFilter.exec(html)) !== null) {
    for (const url of urls) {
      if (
        url &&
        url !== '//' &&
        url !== '"' &&
        !url.includes('url') &&
        !url.includes('href') &&
        !url.includes('src')
      ) {
        urlFilteredHtml = urlFilteredHtml.replace(
          url,
          urlParser(url)
            .set('protocol', '')
            .set('slashes', '')
            .set('username', '')
            .set('password', '')
            .set('host', '')
            .toString()
        );
      }
    }
  }

  const tagAndUrlFilteredHtml = urlFilteredHtml.replace(tagFilter, '');

  return tagAndUrlFilteredHtml;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const body = req.body as string;

    if (body.length > 1000) {
      res
        .status(400)
        .json({ message: 'More than 1000 characters at once not allowed!' });
      return;
    }

    const tagAndUrlFilteredBody = filterHtml(body);

    await PageDataService.put(
      req.query.pageId as string,
      tagAndUrlFilteredBody
    );
  } else if (req.method === 'PUT') {
    const { oldHtmlItem, newHtmlItem } = req.body as Replace;

    if (newHtmlItem.length > 1000) {
      res
        .status(400)
        .json({ message: 'More than 1000 characters at once not allowed!' });
      return;
    }

    const tagAndUrlFilteredItem = filterHtml(newHtmlItem);

    await PageDataService.rep(
      req.query.pageId as string,
      oldHtmlItem,
      tagAndUrlFilteredItem
    );
  } else if (req.method === 'DELETE') {
    await PageDataService.del(req.query.pageId as string, req.body);
  }

  const page = await PageDataService.get(req.query.pageId as string);

  res.setHeader('Content-Type', 'application/json');

  res.status(200).json(page);
};
