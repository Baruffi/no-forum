import Page from './Page';

export default interface PageDataService {
  get(pageId: string): Promise<Page>;
  put(pageId: string, htmlItem: string): Promise<void>;
  rep(pageId: string, oldHtmlItem: string, newHtmlItem: string): Promise<void>;
  del(pageId: string, html: string): Promise<void>;
}
