export interface Page {
  id: string;
  fragments: PageFragment[];
}

export interface PageFragment {
  id: string;
  html: string;
  css: string;
}

export interface PageDataService {
  get(pageId: string): Promise<Page>;
  put(pageId: string, html: string, css: string): Promise<void>;
  rep(
    pageId: string,
    fragmentId: string,
    html: string,
    css: string
  ): Promise<void>;
  del(pageId: string, fragmentId: string): Promise<void>;
}

export interface Replacement {
  fragmentId: string;
  fragment: string;
}
