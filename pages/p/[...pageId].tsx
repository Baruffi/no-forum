import formatHtml from 'helpers/formatHtml';
import { Page, PageFragment } from 'interfaces/Pages';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ChangeEvent, useEffect, useState } from 'react';
import { maxUserContentLength } from 'resources/constants';
import PageDataService from 'services/page-data-service';
import stc from 'string-to-color';
import styles from 'styles/Pages.module.css';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const pageId = (context.query.pageId as string[]).join('/');
  const emptyPage: Page = { id: pageId, fragments: [] };
  const page = (await PageDataService.get(pageId)) || emptyPage;

  return {
    props: {
      page,
    },
  };
}

export default function Sandbox({
  page,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  // Global Content
  const [globalContent, setGlobalContent] = useState<PageFragment[]>(
    page.fragments
  );

  // Fragment Content
  const [fragmentId, setFragmentId] = useState<string>('');
  const [fragmentWasEdited, setFragmentWasEdited] = useState<boolean>(false);

  // User Content
  const [userContent, setUserContent] = useState<string>('');
  const [userCache, setUserCache] = useState<string>('');

  // Controls
  const [disableStyles, setDisableStyles] = useState<boolean>(false);
  const [showInvisibles, setShowInvisibles] = useState<boolean>(false);

  // Api
  const router = useRouter();
  const apiUrl: RequestInfo = `/api/p/${(router.query.pageId as string[]).join(
    '/'
  )}`;

  async function get() {
    const response = await fetch(apiUrl);

    handleResponse(response);
  }

  async function post() {
    if (userContent) {
      const response = await fetch(apiUrl, {
        headers: [['Content-Type', 'text/html']],
        method: 'POST',
        body: userContent,
      });

      const success = await handleResponse(response);

      if (success) {
        flushLocal();
      }
    }
  }

  async function replace() {
    const htmlFragment = getCurrentFragment();
    const html = userContent;

    if (htmlFragment && html && fragmentWasEdited) {
      const response = await fetch(apiUrl, {
        headers: [['Content-Type', 'application/json']],
        method: 'PUT',
        body: JSON.stringify({
          id: htmlFragment.id,
          html,
          invisible: htmlFragment.invisible,
        } as PageFragment),
      });

      const success = await handleResponse(response);

      if (success) {
        flushLocal();
      }
    }
  }

  async function remove() {
    if (fragmentId) {
      const response = await fetch(apiUrl, {
        headers: [['Content-Type', 'text/html']],
        method: 'DELETE',
        body: fragmentId,
      });

      const success = await handleResponse(response);

      if (success) {
        flushLocal();
      }
    }
  }

  async function handleResponse(response: Response) {
    if (response.ok) {
      if (response.status === 200) {
        const newPage = (await response.json()) as Page;
        const oldFragmentsStr = JSON.stringify(globalContent);
        const newFragmentsStr = JSON.stringify(newPage.fragments);

        if (oldFragmentsStr !== newFragmentsStr) {
          setGlobalContent(newPage.fragments);
        }
      }

      return true;
    } else {
      console.error('Error communicating with the serverside api!');

      return false;
    }
  }

  function flushLocal() {
    setUserContent(userCache);
    setUserCache('');
    setFragmentId('');
    setFragmentWasEdited(false);
  }

  function getCurrentFragment() {
    const htmlFragment = globalContent.find(
      (htmlFragment) => htmlFragment.id === fragmentId
    );

    return htmlFragment;
  }

  function isCss(html: string) {
    return !html.includes('<') && html.includes('{');
  }

  useEffect(() => {
    const nextUpdate = setInterval(get, 10000); // passively update the page every 10 seconds unless the user interacts with it

    return () => {
      clearInterval(nextUpdate);
    };
  }, [userContent]);

  function updateUserContent(e: ChangeEvent<HTMLTextAreaElement>) {
    const updatedContent = e.target.value.substr(0, maxUserContentLength);

    setUserContent(updatedContent);

    if (fragmentId) {
      const originalContent = formatHtml(getCurrentFragment().html); // format html to match user content

      setFragmentWasEdited(originalContent !== updatedContent);
    }
  }

  function hoverHtmlFragment(id: string, html: string) {
    if (fragmentId !== id) {
      if (!fragmentId) {
        setUserCache(userContent);
      }

      if (fragmentWasEdited) {
        setFragmentWasEdited(false);
      }

      setFragmentId(id);
      setUserContent(formatHtml(html)); // format html on demand
    }
  }

  function hoverUserContent() {
    if (fragmentId) {
      flushLocal();
    }
  }

  function toggleDisableStyles() {
    setDisableStyles(!disableStyles);
  }

  function toggleShowInvisibles() {
    setShowInvisibles(!showInvisibles);
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Noforum Sandbox Page</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.controls}>
        <div className={styles.column}>
          <textarea
            value={userContent}
            onChange={updateUserContent}
            maxLength={maxUserContentLength}
          />
          <sub>
            {userContent.length}/{maxUserContentLength}
          </sub>
          <div className={styles.row}>
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
    </div>
  );
}
