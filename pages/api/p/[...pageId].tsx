import filterHtml from 'helpers/filterHtml';
import { PageFragment } from 'interfaces/Pages';
import { NextApiRequest, NextApiResponse } from 'next';
import { maxUserContentLength } from 'resources/constants';
import PageDataService from 'services/page-data-service';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const pageId = (req.query.pageId as string[]).join('/');

  if (req.method === 'POST') {
    const body = req.body as string;

    if (body.length > maxUserContentLength) {
      res.status(400).json({
        message: `More than ${maxUserContentLength} characters at once not allowed!`,
      });
      return;
    }

    const { cleanHtml, cleanCss } = filterHtml(body);

    if (cleanHtml) {
      await PageDataService.put(pageId, cleanHtml, false);
    }

    if (cleanCss) {
      await PageDataService.put(pageId, cleanCss, true);
    }
  } else if (req.method === 'PUT') {
    const { id, html, invisible } = req.body as PageFragment;

    if (html.length > maxUserContentLength) {
      res.status(400).json({
        message: `More than ${maxUserContentLength} characters at once not allowed!`,
      });
      return;
    }

    const { cleanHtml, cleanCss } = filterHtml(html);

    if (invisible) {
      if (cleanHtml) {
        await PageDataService.put(pageId, cleanHtml, false);
      }

      if (cleanCss) {
        await PageDataService.rep(pageId, id, cleanCss, true);
      }
    } else {
      if (cleanHtml) {
        await PageDataService.rep(pageId, id, cleanHtml, false);
      }

      if (cleanCss) {
        await PageDataService.put(pageId, cleanCss, true);
      }
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
