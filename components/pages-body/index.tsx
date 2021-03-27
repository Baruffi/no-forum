import stc from 'string-to-color';
import styles from 'styles/Pages.module.css';
import { BodyProps } from './types';

export default function PageBody({
  // values
  globalContent,
  fragmentId,
  userContent,
  userCache,
  disableStyles,
  showInvisibles,
  // functions
  hoverUserContent,
  hoverHtmlFragment,
}: BodyProps) {
  function isCss(html: string) {
    return !html.includes('<') && html.includes('{');
  }

  return (
    <div className={styles.column}>
      {globalContent.map((htmlFragment) => (
        <div
          key={htmlFragment.id}
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
          onMouseEnter={() =>
            hoverHtmlFragment(htmlFragment.id, htmlFragment.html)
          }
          dangerouslySetInnerHTML={{
            __html:
              fragmentId === htmlFragment.id
                ? isCss(userContent)
                  ? `<style>${userContent}</style>`
                  : userContent
                : htmlFragment.invisible && disableStyles
                ? ''
                : htmlFragment.html,
          }}
        />
      ))}
      <div
        onMouseEnter={hoverUserContent}
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
