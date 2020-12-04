import { SeverityLevel } from '@microsoft/applicationinsights-web';
import templates from '../../graph-toolkit-examples';
import { telemetry } from '../../telemetry';
import { LINK_ERROR } from '../../telemetry/error-types';
import { IQuery } from '../../types/query-runner';
import { sanitizeQueryUrl } from './query-url-sanitization';
import { parseSampleUrl } from './sample-url-generation';


export async function validateToolkitUrl(url: string, sampleQuery: IQuery): Promise<void> {
  await fetch(url)
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
      })
      .catch(error => {
        const sanitizedUrl = sanitizeQueryUrl(sampleQuery.sampleUrl);
        telemetry.trackException(
          new Error(LINK_ERROR),
          SeverityLevel.Error,
          {
            ComponentName: 'Graph toolkit link',
            QuerySignature: `${sampleQuery.selectedVerb} ${sanitizedUrl}`,
            Link: url,
            Message: `${error}`
          });
      });
 }

export function lookupToolkitUrl(sampleQuery: IQuery) {
  if (sampleQuery) {
    const { requestUrl, search } = parseSampleUrl(sampleQuery.sampleUrl);
    const query = '/' + requestUrl + search;
    for (const templateMapKey in templates) {
      if (templates.hasOwnProperty(templateMapKey)) {
        const isMatch = new RegExp(templateMapKey + '$', 'i').test(query);
        if (isMatch) {
          const toolkitUrl: string = (templates as any)[templateMapKey];
          let { search: componentUrl } = parseSampleUrl(toolkitUrl);
          componentUrl = componentUrl.replace('?id=', '');
          return {
            exampleUrl: `https://mgt.dev/?path=/story/${componentUrl}`,
            toolkitUrl: toolkitUrl
          };
        }
      }
    }

  }
  return { toolkitUrl: null, exampleUrl: null };
}