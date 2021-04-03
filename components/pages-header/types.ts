import { Layout } from 'interfaces/Layout';
import { ChangeEvent } from 'react';

export interface HeaderProps {
  // config
  layout: Layout;
  isTooltipVisible: boolean;
  // values
  userContent: string;
  fragmentId: string;
  fragmentWasEdited: boolean;
  disableStyles: boolean;
  showInvisibles: boolean;
  // content functions
  updateUserContent(e: ChangeEvent<HTMLTextAreaElement>): void;
  cycleLayout(): void;
  toggleDisableStyles(): void;
  toggleShowInvisibles(): void;
  // api functions
  post(): Promise<void>;
  replace(): Promise<void>;
  flushLocal(): void;
}
