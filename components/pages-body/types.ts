import { PageFragment } from 'interfaces/Pages';

export interface BodyProps {
  // values
  globalContent: PageFragment[];
  fragmentId: string;
  userContent: string;
  userCache: string;
  disableStyles: boolean;
  showInvisibles: boolean;
  // functions
  hoverUserContent(): void;
  hoverHtmlFragment(id: string, html: string): void;
}
