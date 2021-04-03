import { maxUserContentLength } from 'resources/constants';
import styles from 'styles/Pages.module.css';
import { HeaderProps } from './types';

export default function PagesHeader({
  // config
  layout,
  // values
  userContent,
  fragmentId,
  fragmentWasEdited,
  disableStyles,
  showInvisibles,
  // content functions
  updateUserContent,
  cycleLayout,
  toggleDisableStyles,
  toggleShowInvisibles,
  // api functions
  post,
  replace,
  flushLocal,
}: HeaderProps) {
  function getNextLayoutOption() {
    switch (layout.anchor) {
      case 'left':
        return 'up';
      case 'top':
        return 'forward';
      case 'right':
        return 'down';
      case 'bottom':
        return 'back';
      default:
        break;
    }
  }

  return (
    <div className={`${styles[layout.anchor]} ${styles.panel}`}>
      <div className={`${styles['spacer-start']} ${styles.icons}`}>
        <button onClick={cycleLayout}>
          <img
            src={`/chevron-${getNextLayoutOption()}.svg`}
            width={25}
            height={25}
          />
        </button>
        <button onClick={toggleDisableStyles}>
          <img
            src={`/color-fill${disableStyles ? '-outline' : ''}.svg`}
            width={25}
            height={25}
          />
        </button>
        <button onClick={toggleShowInvisibles}>
          <img
            src={`/eye${showInvisibles ? '-off' : ''}.svg`}
            width={25}
            height={25}
          />
        </button>
      </div>
      <div className={styles['spacer-end']}>
        <button className={styles.float}>+</button>
        <button className={styles.float}>-</button>
        <button className={styles.float}>T</button>
      </div>
      <div className={`${styles['spacer-center']} ${styles.controls}`}>
        <div className={styles.column}>
          <textarea
            value={userContent}
            onChange={updateUserContent}
            maxLength={maxUserContentLength}
            autoFocus
          />
          <sub>
            {userContent.length}/{maxUserContentLength}
          </sub>
          <div className={styles.row}>
            {fragmentId ? (
              fragmentWasEdited && userContent ? (
                <>
                  <button onClick={replace}>Confirm Changes</button>
                  <button onClick={flushLocal}>Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={flushLocal}>Cancel</button>
                </>
              )
            ) : userContent ? (
              <>
                <button onClick={post}>Confirm Changes</button>
                <button onClick={flushLocal}>Cancel</button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
