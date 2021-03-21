import Page from 'interfaces/Page';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import PageDataService from 'services/page-data-service';
import styles from 'styles/Home.module.css';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const pageId = context.query.pageId;
  const emptyPage = { id: pageId, html: '' };
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
  const [globalContent, setGlobalContent] = useState<string>(page.html);
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

        setUserContent('');
      } else {
        console.error('Error posting to serverside api!');
      }
    }
  }

  async function clear() {
    if (globalContent) {
      const response = await fetch(apiUrl, {
        headers: [['Content-Type', 'text/html']],
        method: 'DELETE',
        body: globalContent,
      });

      if (response.ok) {
        const page = (await response.json()) as Page;

        if (globalContent != page.html) {
          setGlobalContent(page.html);
        }
      } else {
        console.error('Error posting to serverside api!');
      }
    }
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

      <textarea
        value={userContent}
        onChange={(e) => setUserContent(e.target.value)}
      />

      <div>
        <button onClick={() => post()}>Confirm Changes</button>
        <button onClick={() => clear()}>Clear Global Content</button>
      </div>

      <div className={styles.main}>
        <div
          dangerouslySetInnerHTML={{ __html: globalContent + userContent }}
        />
      </div>
    </div>
  );
}
