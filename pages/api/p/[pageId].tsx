import { Replacement } from 'interfaces/Pages';
import { NextApiRequest, NextApiResponse } from 'next';
import sanitizeHtml from 'sanitize-html';
import PageDataService from 'services/page-data-service';
import allowedStyles from 'resources/allowed-styles';

function filterHtml(html: string) {
  return sanitizeHtml(html, {
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['style'],
    },
    allowedStyles: {
      '*': allowedStyles,
    },
    allowedSchemes: [],
    exclusiveFilter: function (frame) {
      return !['td', 'th', 'tr'].includes(frame.tag) && !frame.text.trim();
    },
  });
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

    const filteredHtml = filterHtml(body);

    if (filteredHtml) {
      await PageDataService.put(req.query.pageId as string, filteredHtml);
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
      await PageDataService.rep(
        req.query.pageId as string,
        fragmentId,
        filteredHtml
      );
    }
  } else if (req.method === 'DELETE') {
    await PageDataService.del(req.query.pageId as string, req.body);
  }

  const page = await PageDataService.get(req.query.pageId as string);

  if (page) {
    res.setHeader('Content-Type', 'application/json');

    res.status(200).json(page);
  } else {
    res.status(204).send('');
  }
};
