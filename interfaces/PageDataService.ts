import Page from "./Page";

export default interface PageDataService {
  get(pageId: string): Promise<Page>;
  put(pageId: string, html: string): Promise<void>;
}
