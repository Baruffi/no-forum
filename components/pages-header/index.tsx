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
  remove,
  flushLocal,
}: HeaderProps) {
  function getNextLayoutOption() {
    switch (layout.anchor) {
      case 'left':
        return 'Top';
      case 'top':
        return 'Right';
      case 'right':
        return 'Bottom';
      case 'bottom':
        return 'Left';
      default:
        break;
    }
  }

  return (
    <div className={`${styles[layout.anchor]} ${styles.panel}`}>
      <div className={styles.controls}>
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
            <button onClick={cycleLayout}>
              {getNextLayoutOption()} Layout
            </button>
            <button onClick={toggleDisableStyles}>
              {disableStyles ? 'Enable Styles' : 'Disable Styles'}
            </button>
            <button onClick={toggleShowInvisibles}>
              {showInvisibles ? 'Hide Invisibles' : 'Show Invisibles'}
            </button>
            {fragmentId ? (
              fragmentWasEdited && userContent ? (
                <>
                  <button onClick={replace}>Confirm Changes</button>
                  <button onClick={remove}>Delete</button>
                  <button onClick={flushLocal}>Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={remove}>Delete</button>
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
          <cite>
            {showInvisibles
              ? 'You can edit style tags here. If you add any other tags, they will be commited as a new visible element!'
              : 'You can edit the visible html here. If you add any style tags, they will be commited as a new invisible element!'}
          </cite>
        </div>
      </div>
    </div>
  );
}
