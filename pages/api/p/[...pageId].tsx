import { Replacement } from 'interfaces/Pages';
import { NextApiRequest, NextApiResponse } from 'next';
import DOMPurify from 'isomorphic-dompurify';
import PageDataService from 'services/page-data-service';

function filterHtml(html: string) {
  return DOMPurify.sanitize(html);
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const pageId = (req.query.pageId as string[]).join('/');

  if (req.method === 'POST') {
    const body = req.body as string;

    if (body.length > 1000) {
      res
        .status(400)
        .json({ message: 'More than 1000 characters at once not allowed!' });
      return;
    }

    const filteredHtml = filterHtml(body);

    if (filteredHtml) {
      await PageDataService.put(pageId, filteredHtml);
    }
  } else if (req.method === 'PUT') {
    const { fragmentId, html } = req.body as Replacement;

    if (html.length > 1000) {
      res
        .status(400)
        .json({ message: 'More than 1000 characters at once not allowed!' });
      return;
    }

    const filteredHtml = filterHtml(html);

    if (filteredHtml) {
      await PageDataService.rep(pageId, fragmentId, filteredHtml);
    }
  } else if (req.method === 'DELETE') {
    await PageDataService.del(pageId, req.body);
  }

  const page = await PageDataService.get(pageId);

  if (page) {
    res.setHeader('Content-Type', 'application/json');

    res.status(200).json(page);
  } else {
    res.status(204).send('');
  }
};
