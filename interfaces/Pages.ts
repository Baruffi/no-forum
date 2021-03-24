export interface Page {
  id: string;
  fragments: PageFragment[];
}

export interface PageFragment {
  id: string;
  html: string;
  invisible: boolean;
}

export interface PageDataService {
  get(pageId: string): Promise<Page>;
  put(pageId: string, html: string, invisible: boolean): Promise<void>;
  rep(
    pageId: string,
    fragmentId: string,
    html: string,
    invisible: boolean
  ): Promise<void>;
  del(pageId: string, fragmentId: string): Promise<void>;
}

export interface Replacement {
  fragmentId: string;
  html: string;
}
