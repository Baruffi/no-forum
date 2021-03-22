import Page from 'interfaces/Page';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import PageDataService from 'services/page-data-service';
import styles from 'styles/Pages.module.css';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const pageId = context.query.pageId;
  const emptyPage = { id: pageId, html: [] };
  const page = (await PageDataService.get(pageId as string)) || emptyPage;

  return {
    props: {
      page,
    },
  };
}

export default function Sandbox({
  page,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [globalContent, setGlobalContent] = useState<string[]>(page.html);
  const [partialId, setPartialId] = useState<number>(-1);
  const [userContent, setUserContent] = useState<string>('');

  const router = useRouter();
  const apiUrl: RequestInfo = `/api/p/${router.query.pageId}`;

  async function get() {
    const response = await fetch(apiUrl);

    if (response.ok) {
      const page = (await response.json()) as Page;

      if (globalContent != page.html) {
        setGlobalContent(page.html);
      }
    } else {
      console.error('Error getting updates from the serverside api!');
    }
  }

  async function post() {
    if (userContent) {
      const response = await fetch(apiUrl, {
        headers: [['Content-Type', 'text/html']],
        method: 'POST',
        body: userContent,
      });

      if (response.ok) {
        const page = (await response.json()) as Page;

        if (globalContent != page.html) {
          setGlobalContent(page.html);
        }

        flushLocal();
      } else {
        console.error('Error posting to serverside api!');
      }
    }
  }

  async function replace() {
    const oldHtmlItem = globalContent[partialId];
    const newHtmlItem = userContent;

    if (oldHtmlItem && newHtmlItem && oldHtmlItem != newHtmlItem) {
      const response = await fetch(apiUrl, {
        headers: [['Content-Type', 'application/json']],
        method: 'PUT',
        body: JSON.stringify({ oldHtmlItem, newHtmlItem }),
      });

      if (response.ok) {
        const page = (await response.json()) as Page;

        if (globalContent != page.html) {
          setGlobalContent(page.html);
        }

        flushLocal();
      } else {
        console.error('Error posting to serverside api!');
      }
    }
  }

  async function remove() {
    const htmlItem = globalContent[partialId];

    if (htmlItem) {
      const response = await fetch(apiUrl, {
        headers: [['Content-Type', 'text/html']],
        method: 'DELETE',
        body: htmlItem,
      });

      if (response.ok) {
        const page = (await response.json()) as Page;

        if (globalContent != page.html) {
          setGlobalContent(page.html);
        }

        flushLocal();
      } else {
        console.error('Error posting to serverside api!');
      }
    }
  }

  function flushLocal() {
    setPartialId(-1);
    setUserContent('');
  }

  useEffect(() => {
    const nextUpdate = setInterval(get, 10000);

    return () => {
      clearInterval(nextUpdate);
    };
  }, [userContent]);

  return (
    <div className={styles.container}>
      <Head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="style-src 'self' 'unsafe-inline'; object-src 'none'; default-src 'self';"
        />
        <meta name="referrer" content="strict-origin" />

        <title>Noforum Sandbox Page</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.controls}>
        <textarea
          value={userContent}
          onChange={(e) => setUserContent(e.target.value)}
        />

        {partialId === -1 ? (
          <div>
            <button onClick={post}>Confirm Changes</button>
          </div>
        ) : (
          <div>
            <button onClick={replace}>Confirm Changes</button>
            <button onClick={remove}>Delete</button>
            <button onClick={flushLocal}>Cancel</button>
          </div>
        )}
      </div>

      <div className={styles.main}>
        {globalContent.map((htmlItem, idx) => (
          <div
            key={idx}
            onMouseEnter={() => {
              if (partialId !== idx) {
                setPartialId(idx);
                setUserContent(htmlItem);
              }
            }}
            dangerouslySetInnerHTML={{
              __html: partialId === idx ? userContent : htmlItem,
            }}
          />
        ))}
        <div
          dangerouslySetInnerHTML={{
            __html: partialId === -1 ? userContent : '',
          }}
          onDoubleClick={() => setUserContent('')}
        />
      </div>
    </div>
  );
}
