import { NextApiRequest, NextApiResponse } from 'next';
import PageDataService from 'services/page-data-service';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    await PageDataService.put(req.query.pageId as string, req.body);
  }

  const page = await PageDataService.get(req.query.pageId as string);

  res.setHeader('Content-Type', 'application/json');

  res.status(200).json(page);
};
