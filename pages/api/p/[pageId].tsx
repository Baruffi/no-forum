import Replace from 'interfaces/Replace';
import { NextApiRequest, NextApiResponse } from 'next';
import PageDataService from 'services/page-data-service';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    if ((req.body as string).length > 1000) {
      res
        .status(400)
        .json({ message: 'More than 1000 characters at once not allowed!' });
      return;
    }

    const scriptFilter = new RegExp(/<script.*?>(.*?<\/script>)?/, 'gs');
    const httpFilter = new RegExp(/http(s)?:\/\//, 'g');
    const filteredHtml = (req.body as string)
      .replace(httpFilter, '')
      .replace(scriptFilter, '');

    await PageDataService.put(req.query.pageId as string, filteredHtml);
  } else if (req.method === 'PUT') {
    const { oldHtmlItem, newHtmlItem } = req.body as Replace;

    await PageDataService.rep(
      req.query.pageId as string,
      oldHtmlItem,
      newHtmlItem
    );
  } else if (req.method === 'DELETE') {
    await PageDataService.del(req.query.pageId as string, req.body);
  }

  const page = await PageDataService.get(req.query.pageId as string);

  res.setHeader('Content-Type', 'application/json');

  res.status(200).json(page);
};
