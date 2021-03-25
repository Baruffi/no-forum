import { Parser } from 'htmlparser2';
import { ChunkList } from 'interfaces/filterHtml';
import DOMPurify from 'isomorphic-dompurify';

function filterCss(style: string) {
  const cssBadImportant = /[\w-]+\s*:.*?!important.*?;?/gs;
  const cssBadUrl = /[\w-]+\s*:\s*url\(\s*(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?\s*\)((.|\s)*?;)?/g;
  const cssBadZIndex = /z-index\s*:\s*(-)?\d\d\d\d+\s*;?/g;

  if (style) {
    const badImportants = style.match(cssBadImportant);

    if (badImportants) {
      for (const badImportant of badImportants) {
        const noImportant = badImportant.replace('!important', '');

        style = style.replace(badImportant, noImportant);
      }
    }

    return style.replace(cssBadUrl, '').replace(cssBadZIndex, '');
  }
}

function customSanitize(html: string) {
  const htmlStyleTag = /<style(\s*|([\w-]+=".*?"))*?>.*?<\/\s*style\s*>\s*/gs;
  const htmlEmptyStyleTag = /<style(\s*|([\w-]+=".*?"))*?>\s*<\/\s*style\s*>\s*/gs;
  const htmlEmptyStyleAttribute = /\s*style\s*=\s*"\s*"/g;
  const htmlOpenTagStr = '<TAGHERE(\\s*|([\\w-]+="(.|\\s)*?"))*?>\\s*';
  const htmlCloseTagStr = '</\\s*TAGHERE\\s*>\\s*';
  const cssChunks: ChunkList = {};
  const noTextChunks: ChunkList = {};

  let openedWithNoText = [];
  let openCss = 0;

  const parser = new Parser({
    onopentag(name, attribs) {
      if (name === 'style') {
        openCss++;
      }

      let style = attribs.style;

      if (style) {
        cssChunks[style] = filterCss(style);
      }

      openedWithNoText.push(name);
    },
    ontext(text) {
      if (openCss) {
        cssChunks[text] = filterCss(text);
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
              .map(
                (emptyTag) => `${htmlOpenTagStr.replace('TAGHERE', emptyTag)}`
              )
              .join('') +
            openedWithNoText
              .reverse()
              .map(
                (emptyTag) => `${htmlCloseTagStr.replace('TAGHERE', emptyTag)}`
              )
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
  let cleanCss = '';

  console.log('CSS');

  for (const chunk in cssChunks) {
    if (Object.prototype.hasOwnProperty.call(cssChunks, chunk)) {
      const cssChunk = cssChunks[chunk];
      console.log(chunk);
      console.log(cssChunk);
      cleanHtml = cleanHtml.replace(chunk, cssChunk).trim();
    }
  }

  console.log('NO TEXT');

  for (const chunk in noTextChunks) {
    if (Object.prototype.hasOwnProperty.call(noTextChunks, chunk)) {
      const noTextChunk = noTextChunks[chunk];
      console.log(chunk);
      console.log(noTextChunk);
      cleanHtml = cleanHtml.replace(RegExp(chunk, 'g'), noTextChunk).trim();
    }
  }

  console.log('CLEAN');

  cleanHtml = cleanHtml
    .replace(htmlEmptyStyleTag, '')
    .replace(htmlEmptyStyleAttribute, '');

  console.log(cleanHtml);

  if (cleanHtml) {
    const matchedCss = cleanHtml.match(htmlStyleTag);
    if (matchedCss) {
      for (const match of matchedCss) {
        if (match.includes('<')) {
          cleanHtml = cleanHtml.replace(match, '');
          cleanCss += match
            .replace(
              RegExp(htmlOpenTagStr.replace('TAGHERE', 'style'), 'g'),
              ''
            )
            .replace(
              RegExp(htmlCloseTagStr.replace('TAGHERE', 'style'), 'g'),
              ''
            );

          if (!cleanCss.trim().endsWith('}')) {
            cleanCss += '}\n';
          }
        }
      }
    }
  }

  if (cleanCss) {
    cleanCss = `<style>\n${cleanCss}</style>`;
  }

  return { cleanHtml, cleanCss };
}

export default function filterHtml(html: string) {
  console.log('RAW');
  console.log(html);

  if (html.includes('{') && !html.includes('<')) {
    html = `<style>${html}`;
  }

  // Add body tags to not lose styles in the beginning to DOMPurify
  const purifiedHtml = DOMPurify.sanitize(`<body>${html}`, {
    ALLOWED_URI_REGEXP: /^(\/?[^:#/\\])*$/,
  });

  console.log('PURE');
  console.log(purifiedHtml);

  return customSanitize(purifiedHtml);
}
