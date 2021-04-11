import PageBody from 'components/pages-body';
import PagesHeader from 'components/pages-header';
import formatHtml from 'helpers/formatHtml';
import { Layout } from 'interfaces/Layout';
import { Page, PageFragment } from 'interfaces/Pages';
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { maxUserContentLength } from 'resources/constants';
import PageDataService from 'services/page-data-service';
import styles from 'styles/Pages.module.css';
import swal from 'sweetalert';

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
  // Load
  const [isTooltipVisible, setTooltipVisibility] = useState(false);
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
  const [layout, setLayout] = useState<Layout>({
    orientation: 'horizontal',
    anchor: 'top',
  });
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
        handleResponseSuccess();
      } else {
        handleResponseError();
      }
    }
  }

  async function replace() {
    const htmlFragment = getFragment(fragmentId);
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
        handleResponseSuccess();
      } else {
        handleResponseError();
      }
    }
  }

  async function remove(id: string) {
    if (id) {
      const confirmation = await swal({
        title: 'Are you sure?',
        text:
          'Once deleted, you will not be able to recover this html fragment!',
        icon: 'warning',
        buttons: [true, true],
        dangerMode: true,
      });

      if (confirmation) {
        const response = await fetch(apiUrl, {
          headers: [['Content-Type', 'text/html']],
          method: 'DELETE',
          body: id,
        });

        const success = await handleResponse(response);

        if (success) {
          swal('Poof!', 'The html fragment has been deleted!', 'success');
          handleResponseSuccess();
        } else {
          handleResponseError();
        }
      } else {
        swal('The html fragment is safe!');
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
      return false;
    }
  }

  function handleResponseSuccess() {
    toast.success('Success :)');
    flushLocal();
  }

  function handleResponseError() {
    toast.error('Something went wrong :(');
  }

  function flushLocal() {
    setUserContent(userCache);
    setUserCache('');
    setFragmentId('');
    setFragmentWasEdited(false);
  }

  function getFragment(id: string) {
    const htmlFragment = globalContent.find(
      (htmlFragment) => htmlFragment.id === id
    );

    return htmlFragment;
  }

  useEffect(() => {
    setTooltipVisibility(true);
  }, []);

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
      const originalContent = formatHtml(getFragment(fragmentId).html); // format html to match user content

      setFragmentWasEdited(originalContent !== updatedContent);
    }
  }

  function edit(id: string) {
    if (fragmentId !== id) {
      if (!fragmentId) {
        setUserCache(userContent);
      }

      if (fragmentWasEdited) {
        setFragmentWasEdited(false);
      }

      setFragmentId(id);
      setUserContent(formatHtml(getFragment(id).html)); // format html on demand
    }
  }

  function cycleLayout() {
    switch (layout.anchor) {
      case 'left':
        setLayout({ orientation: 'horizontal', anchor: 'top' });
        break;
      case 'top':
        setLayout({ orientation: 'vertical', anchor: 'right' });
        break;
      case 'right':
        setLayout({ orientation: 'horizontal', anchor: 'bottom' });
        break;
      case 'bottom':
        setLayout({ orientation: 'vertical', anchor: 'left' });
        break;
      default:
        break;
    }
  }

  function layoutToast() {
    switch (layout.anchor) {
      case 'left':
      case 'top':
        return 'bottom-right';
      case 'right':
      case 'bottom':
        return 'top-left';
      default:
        break;
    }
  }

  function newestOnTop() {
    switch (layout.anchor) {
      case 'left':
      case 'top':
        return false;
      case 'right':
      case 'bottom':
        return true;
      default:
        break;
    }
  }

  function toggleDisableStyles() {
    setDisableStyles(!disableStyles);
  }

  function toggleShowInvisibles() {
    setShowInvisibles(!showInvisibles);
  }

  return (
    <div
      className={`${styles.page} ${
        styles[`${layout.orientation}-${layout.anchor}`]
      }`}
    >
      <Head>
        <title>Noforum Sandbox Page</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <PagesHeader
        // config
        layout={layout}
        isTooltipVisible={isTooltipVisible}
        // values
        userContent={userContent}
        fragmentId={fragmentId}
        fragmentWasEdited={fragmentWasEdited}
        disableStyles={disableStyles}
        showInvisibles={showInvisibles}
        // content functions
        updateUserContent={updateUserContent}
        cycleLayout={cycleLayout}
        toggleDisableStyles={toggleDisableStyles}
        toggleShowInvisibles={toggleShowInvisibles}
        // api functions
        post={post}
        replace={replace}
        flushLocal={flushLocal}
      />

      <div className={styles.container}>
        <PageBody
          // config
          layout={layout}
          isTooltipVisible={isTooltipVisible}
          // values
          globalContent={globalContent}
          fragmentId={fragmentId}
          fragmentWasEdited={fragmentWasEdited}
          userContent={userContent}
          userCache={userCache}
          disableStyles={disableStyles}
          showInvisibles={showInvisibles}
          // content functions
          edit={edit}
          // api functions
          remove={remove}
        />
      </div>

      <ToastContainer
        position={layoutToast()}
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={newestOnTop()}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}
