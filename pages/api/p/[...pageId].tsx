import { Parser } from 'htmlparser2';
import { Replacement } from 'interfaces/Pages';
import DOMPurify from 'isomorphic-dompurify';
import { NextApiRequest, NextApiResponse } from 'next';
import { maxUserContentLength } from 'resources/constants';
import PageDataService from 'services/page-data-service';

interface ChunkList {
  [s: string]: string;
}

function customSanitize(html: string) {
  const cssBadUrl = /[\w-]+:\s*url\(\s*(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?\s*\)(.*?;)?/gis;
  const cssBadZIndex = /z-index:\s*(-)?\d\d\d\d+\s*;/gis;
  const cssChunks: ChunkList = {};
  const noTextChunks: ChunkList = {};

  let openedWithNoText = [];
  let openCss = 0;

  const parser = new Parser({
    onopentag(name, attribs) {
      if (name === 'style') {
        openCss++;
      }

      if (attribs.style) {
        cssChunks[attribs.style] = attribs.style
          .replace(cssBadUrl, '')
          .replace(cssBadZIndex, '');
      }

      openedWithNoText.push(name);
    },
    ontext(text) {
      if (openCss) {
        cssChunks[text] = text.replace(cssBadUrl, '').replace(cssBadZIndex, '');
      }

      if (text.trim()) {
        openedWithNoText = [];
      }
    },
    onclosetag(name) {
      if (openedWithNoText.length > 0 && openedWithNoText[0] === name) {
        if (
          !(
            openedWithNoText.includes('input') ||
            openedWithNoText.includes('select') ||
            openedWithNoText.includes('textarea') ||
            openedWithNoText.includes('button') ||
            openedWithNoText.includes('fieldset') ||
            openedWithNoText.includes('datalist') ||
            openedWithNoText.includes('output') ||
            openedWithNoText.includes('optgroup')
          )
        ) {
          const emptyTags =
            openedWithNoText
              .map((emptyTag) => `<\\s*${emptyTag}(\\s*[\\w\\d-]+=.*?)*?>\\s*`)
              .join('') +
            openedWithNoText
              .reverse()
              .map((emptyTag) => `</\\s*${emptyTag}\\s*>\\s*`)
              .join('');

          noTextChunks[emptyTags] = '';
        }

        openedWithNoText = [];
      }

      if (name === 'style' && openCss) {
        openCss--;
      }
    },
  });

  parser.write(html);
  parser.end();

  let cleanHtml = html;

  for (const chunk in cssChunks) {
    if (Object.prototype.hasOwnProperty.call(cssChunks, chunk)) {
      const cssChunk = cssChunks[chunk];
      cleanHtml = cleanHtml.replace(chunk, cssChunk);
    }
  }

  cleanHtml = cleanHtml
    .replace(/<style(\s*[\w\d-]+=.*?)*?>\s*<\/\s*style\s*>/g, '')
    .replace(/style=('{2}|"{2})?/g, '');

  for (const chunk in noTextChunks) {
    if (Object.prototype.hasOwnProperty.call(noTextChunks, chunk)) {
      const noTextChunk = noTextChunks[chunk];
      cleanHtml = cleanHtml.replace(RegExp(chunk, 'gs'), noTextChunk);
    }
  }

  const cleanStyles = cleanHtml.match(
    /<style(\s*[\w\d-]+=.*?)*?>.*?<\/\s*style\s*>/gs
  );

  let cleanCss = '';

  if (cleanStyles) {
    for (const cleanStyle of cleanStyles) {
      cleanHtml = cleanHtml.replace(cleanStyle, '');
    }

    cleanCss = cleanStyles.join('\n');
  }

  console.log('CLEAN');
  console.log(cleanHtml);
  console.log(cleanCss);

  return { html: cleanHtml.trim(), css: cleanCss.trim() };
}

function filterHtml(html: string) {
  // Add body tags to not lose styles in the beginning to DOMPurify
  const purifiedHtml = DOMPurify.sanitize(`<body>${html}</body>`, {
    ALLOWED_URI_REGEXP: /^(\/?[^:#/\\])*$/,
  });

  console.log('PURE');
  console.log(purifiedHtml);

  return customSanitize(purifiedHtml);
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const pageId = (req.query.pageId as string[]).join('/');

  if (req.method === 'POST') {
    const fragment = req.body as string;

    if (fragment.length > maxUserContentLength) {
      res.status(400).json({
        message: `More than ${maxUserContentLength} characters at once not allowed!`,
      });
      return;
    }

    const filteredHtml = filterHtml(fragment);

    if (filteredHtml.html || filteredHtml.css) {
      await PageDataService.put(pageId, filteredHtml.html, filteredHtml.css);
    }
  } else if (req.method === 'PUT') {
    const { fragmentId, fragment } = req.body as Replacement;

    if (fragment.length > maxUserContentLength) {
      res.status(400).json({
        message: `More than ${maxUserContentLength} characters at once not allowed!`,
      });
      return;
    }

    const filteredHtml = filterHtml(fragment);

    if (filteredHtml.html || filteredHtml.css) {
      await PageDataService.rep(
        pageId,
        fragmentId,
        filteredHtml.html,
        filteredHtml.css
      );
    }
  } else if (req.method === 'DELETE') {
    await PageDataService.del(pageId, req.body);
  }

  const page = await PageDataService.get(pageId);

  if (page) {
    res.setHeader('Content-Type', 'application/json');

    res.status(200).json(page);
  } else {
    res.status(204).send('');
  }
};
