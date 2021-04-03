import { Fragment } from 'react';
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

  return (
    <div className={`${styles.main} ${styles.column}`}>
      {globalContent.map((htmlFragment) => (
        <Fragment key={htmlFragment.id}>
          <div
            data-for="options"
            data-tip={htmlFragment.id}
            className={fragmentId === htmlFragment.id ? styles.fragment : ''}
            style={
              showInvisibles
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
                : {}
            }
            dangerouslySetInnerHTML={{
              __html:
                fragmentId === htmlFragment.id && fragmentWasEdited
                  ? isCss(userContent)
                    ? `<style>${userContent}</style>`
                    : userContent
                  : htmlFragment.invisible && disableStyles
                  ? ''
                  : htmlFragment.html,
            }}
          />

          {isTooltipVisible && (
            <ReactTooltip
              className={styles.icons}
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
        </Fragment>
      ))}
      <div
        dangerouslySetInnerHTML={{
          __html: fragmentId
            ? isCss(userCache)
              ? `<style>${userCache}</style>`
              : userCache
            : isCss(userContent)
            ? `<style>${userContent}</style>`
            : userContent,
        }}
      />
    </div>
  );
}
