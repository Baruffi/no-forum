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
  const [globalContent, setGlobalContent] = useState<PageFragment[]>(
    page.fragments
  );
  const [fragmentId, setFragmentId] = useState<string>('');
  const [userContent, setUserContent] = useState<string>('');
  const [userCache, setUserCache] = useState<string>('');
  const [showInvisibles, setShowInvisibles] = useState<boolean>(false);

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

    if (htmlFragment && html && htmlFragment.html !== html) {
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
    const htmlFragment = getCurrentFragment();

    if (htmlFragment) {
      const response = await fetch(apiUrl, {
        headers: [['Content-Type', 'text/html']],
        method: 'DELETE',
        body: htmlFragment.id,
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

        if (
          JSON.stringify(globalContent) !== JSON.stringify(newPage.fragments)
        ) {
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
  }

  useEffect(() => {
    const nextUpdate = setInterval(get, 10000); // passively update the page every 10 seconds unless the user interacts with it

    return () => {
      clearInterval(nextUpdate);
    };
  }, [userContent]);

  function updateUserContent(e: ChangeEvent<HTMLTextAreaElement>) {
    setUserContent(e.target.value.substr(0, maxUserContentLength));
  }

  function toggleShowInvisibles() {
    setShowInvisibles(!showInvisibles);
  }

  function hoverHtmlFragment(id: string, html: string) {
    if (fragmentId !== id) {
      if (!fragmentId) {
        setUserCache(userContent);
      }

      setFragmentId(id);
      setUserContent(html);
    }
  }

  function hoverUserContent() {
    if (fragmentId) {
      flushLocal();
    }
  }

  function isCss(html: string) {
    return !html.includes('<') && html.includes('{');
  }

  function getCurrentFragment() {
    return globalContent.find((htmlFragment) => htmlFragment.id === fragmentId);
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
            <button onClick={toggleShowInvisibles}>
              {showInvisibles ? 'Hide Invisibles' : 'Show Invisibles'}
            </button>
            {userContent ? (
              fragmentId ? (
                getCurrentFragment()?.html !== userContent ? (
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
              ) : (
                <>
                  <button onClick={post}>Confirm Changes</button>
                  <button onClick={flushLocal}>Cancel</button>
                </>
              )
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
