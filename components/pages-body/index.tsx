import { PageFragment } from 'interfaces/Pages';
import { CSSProperties } from 'react';
import ReactTooltip from 'react-tooltip';
import stc from 'string-to-color';
import styles from 'styles/Pages.module.css';
import { BodyProps } from './types';

export default function PageBody({
  // config
  layout,
  isTooltipVisible,
  // values
  globalContent,
  fragmentId,
  fragmentWasEdited,
  userContent,
  userCache,
  disableStyles,
  showInvisibles,
  // content functions
  edit,
  // api functions
  remove,
}: BodyProps) {
  function getTooltipPosition() {
    switch (layout.anchor) {
      case 'left':
        return 'right';
      case 'top':
        return 'bottom';
      case 'right':
        return 'left';
      case 'bottom':
        return 'top';
      default:
        break;
    }
  }

  function isCss(html: string) {
    return !html.includes('<') && html.includes('{');
  }

  function getAsCss(content: string) {
    return isCss(content) ? `<style>${content}</style>` : content;
  }

  function getFragmentContent(htmlFragment: PageFragment) {
    return fragmentId === htmlFragment.id && fragmentWasEdited
      ? getAsCss(userContent)
      : htmlFragment.invisible && disableStyles
      ? ''
      : htmlFragment.html;
  }

  function getClassName(htmlFragment: PageFragment) {
    return fragmentId === htmlFragment.id ? styles.fragment : '';
  }

  function getStyle(htmlFragment: PageFragment): CSSProperties {
    return showInvisibles
      ? htmlFragment.invisible
        ? {
            backgroundColor: stc(htmlFragment.id),
            minWidth: '200px',
            minHeight: '200px',
            width: '200px',
            height: '200px',
            maxWidth: '200px',
            maxHeight: '200px',
          }
        : {
            display: 'none',
          }
      : {};
  }

  function getNewContent() {
    return fragmentId ? getAsCss(userCache) : getAsCss(userContent);
  }

  return (
    <div className={styles.column}>
      {globalContent.map((htmlFragment) => (
        <div
          key={htmlFragment.id}
          data-for="options"
          data-tip={htmlFragment.id}
          className={getClassName(htmlFragment)}
          style={getStyle(htmlFragment)}
          dangerouslySetInnerHTML={{
            __html: getFragmentContent(htmlFragment),
          }}
        />
      ))}
      <div
        dangerouslySetInnerHTML={{
          __html: getNewContent(),
        }}
      />
      {isTooltipVisible && (
        <ReactTooltip
          className={styles.icons}
          aria-haspopup="true"
          id="options"
          type="light"
          effect="solid"
          place={getTooltipPosition()}
          clickable={true}
          delayHide={500}
          delayShow={500}
          delayUpdate={500}
          getContent={(dataTip) => (
            <div>
              <button
                data-for="edit"
                data-tip="Edit"
                onClick={() => edit(dataTip)}
              >
                <img src="/create.svg" width={25} height={25} />
              </button>

              <ReactTooltip id="edit" effect="solid" place="top" />

              <button
                data-for="remove"
                data-tip="Remove"
                onClick={() => remove(dataTip)}
              >
                <img src="/trash.svg" width={25} height={25} />
              </button>

              <ReactTooltip id="remove" effect="solid" place="top" />
            </div>
          )}
        />
      )}
    </div>
  );
}
