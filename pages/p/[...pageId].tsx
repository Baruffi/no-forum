import { Page, PageFragment } from 'interfaces/Pages';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ChangeEvent, useEffect, useState } from 'react';
import { maxUserContentLength } from 'resources/constants';
import PageDataService from 'services/page-data-service';
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
    const htmlFragment = globalContent.find(
      (htmlFragment) => htmlFragment.id === fragmentId
    );
    const html = userContent;

    if (htmlFragment && html && htmlFragment.html != html) {
      const response = await fetch(apiUrl, {
        headers: [['Content-Type', 'application/json']],
        method: 'PUT',
        body: JSON.stringify({ fragmentId: htmlFragment.id, html }),
      });

      const success = await handleResponse(response);

      if (success) {
        flushLocal();
      }
    }
  }

  async function remove() {
    const htmlFragment = globalContent.find(
      (htmlFragment) => htmlFragment.id === fragmentId
    );

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

        if (globalContent != newPage.fragments) {
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

  function isCss(html: string) {
    return !html.includes('<') && html.includes('{');
  }

  function getRandomColorFor(fragmentId: string) {
    return (
      '#' +
      (((1 << 24) * ((fragmentId.charCodeAt(0) - 48) / 122)) | 0).toString(16)
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Noforum Sandbox Page</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.controls}>
        <textarea
          value={userContent}
          onChange={updateUserContent}
          maxLength={maxUserContentLength}
        />
        {userContent.length}/{maxUserContentLength}
        <button onClick={toggleShowInvisibles}>
          {showInvisibles ? 'Hide Invisibles' : 'Show Invisibles'}
        </button>
        {fragmentId ? (
          <div>
            <button onClick={replace}>Confirm Changes</button>
            <button onClick={remove}>Delete</button>
            <button onClick={flushLocal}>Cancel</button>
          </div>
        ) : (
          <div>
            <button onClick={post}>Confirm Changes</button>
          </div>
        )}
      </div>

      <div className={styles.main}>
        {globalContent.map((htmlFragment) => (
          <div
            key={htmlFragment.id}
            style={
              showInvisibles
                ? htmlFragment.invisible
                  ? {
                      backgroundColor: getRandomColorFor(htmlFragment.id),
                      minWidth: '200px',
                      minHeight: '200px',
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
