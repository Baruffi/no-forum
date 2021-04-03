import Head from 'next/head';
import { useRouter } from 'next/router';
import { ChangeEvent, useState } from 'react';
import styles from 'styles/Home.module.css';

export default function Home() {
  const [inputPath, setInputPath] = useState('');
  const router = useRouter();

  function updateInputPath(e: ChangeEvent<HTMLInputElement>) {
    setInputPath(e.target.value);
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles['background-top']} />
      <div className={styles['background-bottom']} />

      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to NoForum Sandbox!</h1>
        <br />
        <div className={styles.description}>
          Get started by accessing{' '}
          <form
            className={styles.code}
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/p/${inputPath}`);
            }}
          >
            /p/
            <input
              placeholder="any-path-of-your-choice"
              value={inputPath}
              onChange={updateInputPath}
            />
            <button type="submit">Go!</button>
          </form>
        </div>
      </main>

      <footer className={styles.footer}>
        <div>Noforum Sandbox can be found on:</div>
        <a className={styles.card} href="https://github.com/baruffi/no-forum">
          Github
        </a>
      </footer>
    </div>
  );
}
