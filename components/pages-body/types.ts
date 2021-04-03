import { Layout } from 'interfaces/Layout';
import { PageFragment } from 'interfaces/Pages';

export interface BodyProps {
  // config
  layout: Layout;
  isTooltipVisible: boolean;
  // values
  globalContent: PageFragment[];
  fragmentId: string;
  fragmentWasEdited: boolean;
  userContent: string;
  userCache: string;
  disableStyles: boolean;
  showInvisibles: boolean;
  // content functions
  edit(id: string): void;
  // api functions
  remove(id: string): Promise<void>;
}
