export interface Page {
  id: string;
  fragments: PageFragment[];
}

export interface PageFragment {
  id: string;
  html: string;
}

export interface PageDataService {
  get(pageId: string): Promise<Page>;
  put(pageId: string, html: string): Promise<void>;
  rep(pageId: string, fragmentId: string, html: string): Promise<void>;
  del(pageId: string, fragmentId: string): Promise<void>;
}

export interface Replacement {
  fragmentId: string;
  html: string;
}
