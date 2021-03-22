import { Page, PageFragment } from 'interfaces/Pages';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ChangeEvent, useEffect, useState } from 'react';
import PageDataService from 'services/page-data-service';
import styles from 'styles/Pages.module.css';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const pageId = context.query.pageId as string;
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
  const [partialId, setPartialId] = useState<string>('');
  const [userContent, setUserContent] = useState<string>('');

  const router = useRouter();
  const apiUrl: RequestInfo = `/api/p/${router.query.pageId}`;

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
      (htmlFragment) => htmlFragment.id === partialId
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
      (htmlFragment) => htmlFragment.id === partialId
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
    setPartialId('');
    setUserContent('');
  }

  useEffect(() => {
    const nextUpdate = setInterval(get, 10000);

    return () => {
      clearInterval(nextUpdate);
    };
  }, [userContent]);

  function updateUserContent(e: ChangeEvent<HTMLTextAreaElement>) {
    setUserContent(e.target.value);
  }

  function hoverHtmlFragment(id: string, html: string) {
    if (partialId !== id) {
      setPartialId(id);
      setUserContent(html);
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Noforum Sandbox Page</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.controls}>
        <textarea value={userContent} onChange={updateUserContent} />

        {partialId ? (
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
            onMouseEnter={() =>
              hoverHtmlFragment(htmlFragment.id, htmlFragment.html)
            }
            dangerouslySetInnerHTML={{
              __html:
                partialId === htmlFragment.id ? userContent : htmlFragment.html,
            }}
          />
        ))}
        <div
          dangerouslySetInnerHTML={{
            __html: partialId ? '' : userContent,
          }}
        />
      </div>
    </div>
  );
}
