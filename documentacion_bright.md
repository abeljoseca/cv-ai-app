\> \#\# Documentation Index  
\> Fetch the complete documentation index at: https://docs.brightdata.com/llms.txt  
\> Use this file to discover all available pages before exploring further.

\# Collect LinkedIn Profiles by URL

\> Collect LinkedIn profile data by URL using the Bright Data Web Scraper API (dataset ID gd\_l1viktl72bvl7bjuj0): work history, education, skills and connections.

\#\# Query Parameters

\<ParamField query="dataset\_id" type="string" default="gd\_l1viktl72bvl7bjuj0" required\>  
  The dataset ID used for this request.

  \<Warning\>  
    Must be set to \`gd\_l1viktl72bvl7bjuj0\` to collect \*\*Profiles by URL\*\* data.  
  \</Warning\>  
\</ParamField\>

\<ParamField query="notify" type="boolean" default={false}\>  
  Whether to send notifications when the request is completed.  
\</ParamField\>

\<ParamField query="include\_errors" type="boolean" default={true}\>  
  Whether to include errors in the response.  
\</ParamField\>

\#\# Request Body

\<ParamField body="input" type="object\[\]" required\>  
  An array of input objects.

  \<Expandable title="properties"\>  
    \<ParamField body="url" type="string" required\>  
      The URL of the LinkedIn profile to collect.  
    \</ParamField\>  
  \</Expandable\>

  \#\#\#\# Example

  \`\`\`json wrap theme={null}  
  {  
    "input":\[  
      {"url":"https://www.linkedin.com/in/elad-moshe-05a90413/"},  
      {"url":"https://www.linkedin.com/in/jonathan-myrvik-3baa01109"},  
      {"url":"https://www.linkedin.com/in/aviv-tal-75b81/"},  
      {"url":"https://www.linkedin.com/in/bulentakar/"}  
    \]  
  }  
  \`\`\`  
\</ParamField\>

\<ResponseExample\>  
  \`\`\`json 200 theme={null}  
  \[  
    {  
      "id": "bud\*\*\*eie\*\*\*d-a\*\*\*\*\*\*\*\*\*",  
      "name": "Buddemeier \*\*",  
      "city": "Marshfield, Wisconsin, United States",  
      "country\_code": "US",  
      "position": null,  
      "about": null,  
      "posts": null,  
      "current\_company": {  
        "company\_id": "marshfield-clinic-health-system",  
        "link": "https://www.linkedin.com/company/marshfield-clinic-health-system?trk=public\_profile\_topcard-current-company",  
        "location": null,  
        "name": "Marshfield Clinic"  
      },  
      "experience": \[  
        {  
          "company": "Marshfield Clinic",  
          "company\_logo\_url": "https://media.licdn.com/dms/image/v2/D560BAQG-SexE0os4Kw/company-logo\_100\_100/company-logo\_100\_100/0/1726590593493/marshfield\_clinic\_health\_system\_logo?e=2147483647\&v=beta\&t=dHRCitimMYch4pTLvVukWXMZkhkkRszOlpMekvx9FeQ",  
          "description\_html": null,  
          "subtitle": "\*\*\*\*\*\*\*\*\*\*\*\*\*\* \*\*\*\*\*\*\*\*\*\*\*\*",  
          "title": "Marshfield Clinic"  
        }  
      \],  
      "url": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*6a",  
      "people\_also\_viewed": \[  
        {  
          "about": "Sou\*\*\*rn \*\*\*ica\*\*\*\*\*\*\*\*\*",  
          "location": "2K followers Tallahassee Metropolitan Area",  
          "name": "Bill D\*\*\*n",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*"  
        },  
        {  
          "about": "Car\*\*\*vas\*\*\*ar \*\*\*\*\*\*\*\*\*ts,\*\*\*\*\*\*",  
          "location": "52 followers Columbus, Ohio Metropolitan Area",  
          "name": "Mobusher M\*\*\*\*d",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*459\*\*\*"  
        },  
        {  
          "about": "Mem\*\*\*al \*\*\*man\*\*\*\*\*\*\*\*\*Sys\*\*\*\*\*\*",  
          "location": "301 followers Houston, TX",  
          "name": "Danny H\*\*\*\*\*n",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*78"  
        },  
        {  
          "about": "IU \*\*\*lth\*\*\*rth\*\*\*\*\*\*\*\*\*Cen\*\*\*\*\*\*",  
          "location": "232 followers Fishers, IN",  
          "name": "Farooq I\*\*\*\*\*r",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*610\*\*\*"  
        },  
        {  
          "about": "Car\*\*\*log\*\*\*lin\*\*\*\*\*\*\*\*\* An\*\*\*\*\*\*",  
          "location": "216 followers San Antonio, TX",  
          "name": "Jorge A\*\*\*\*\*z",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*7"  
        },  
        {  
          "about": "Uni\*\*\*sit\*\*\*f C\*\*\*\*\*\*\*\*\*ori\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*ine\*\*\*",  
          "location": "141 followers United States",  
          "name": "Hafiz H\*\*\*\*\*n",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*108\*\*\*"  
        },  
        {  
          "about": "BJC\*\*\*alt\*\*\*yst\*\*\*",  
          "location": "2K followers St Louis, MO",  
          "name": "Deepak K\*\*\*, \*\*\* F\*\*\*, F\*\*\*I",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*fsc\*\*\*\*\*\*\*\*\*\*\*\*"  
        },  
        {  
          "about": "Bap\*\*\*t H\*\*\*th \*\*\*\*\*\*\*\*\*",  
          "location": "309 followers Lexington, KY",  
          "name": "Michael S\*\*\*, \*\*\* M\*\*, F\*\*\*, F\*\*\*I",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*fac\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*"  
        },  
        {  
          "about": "Val\*\*\* Vi\*\*\*Reg\*\*\*\*\*\*\*\*\*pit\*\*\*",  
          "location": "69 followers Glenwood Springs, CO",  
          "name": "Marcus H\*\*\*\*l",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*92"  
        },  
        {  
          "about": "Dan\*\*\*y H\*\*\*ita\*\*\*",  
          "location": "204 followers Danbury, CT",  
          "name": "Hal W\*\*\*\*\*\*\*n",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*2a"  
        },  
        {  
          "about": "Uni\*\*\*sit\*\*\*f K\*\*\*\*\*\*\*\*\*ica\*\*\*\*\*\*\*\*\*",  
          "location": "145 followers Leawood, KS",  
          "name": "Eric H\*\*\*\*\*\*d",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*62"  
        },  
        {  
          "about": "Tuf\*\*\*Med\*\*\*l C\*\*\*\*\*\*",  
          "location": "564 followers Greater Boston",  
          "name": "Mohamad E\*\*\*\*\*\*, M\*\*\*\*\*\*\*\*\*\*M",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*pvi\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*"  
        },  
        {  
          "about": "Ore\*\*\* He\*\*\* Ce\*\*\*\*\*\*\*\*\*",  
          "location": "93 followers Salem, OR",  
          "name": "Kevin T\*\*\*\*\*\*n",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*919\*\*\*"  
        },  
        {  
          "about": "NEA\*\*\*pti\*\*\*Cli\*\*\*\*\*\*",  
          "location": "842 followers Jonesboro, AR",  
          "name": "Matthew H\*\*\*\*\*\*\*, \*\*",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*363\*\*\*\*\*\*"  
        },  
        {  
          "about": "Adv\*\*\*te \*\*\*lth\*\*\*\*\*\*",  
          "location": "56 followers Greater Chicago Area",  
          "name": "Raminder S\*\*\*h \*\*",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*473\*\*\*\*\*\*"  
        },  
        {  
          "about": "Ash\*\*\* He\*\*\* & \*\*\*\*\*\*\*\*\*Cen\*\*\*\*\*\*",  
          "location": "573 followers United States",  
          "name": "Farah \*\* K\*\*\*\*n",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*951\*\*\*"  
        },  
        {  
          "about": "Met\*\*\*etr\*\*\* Ca\*\*\*\*\*\*\*\*\*lar\*\*\*\*\*\*\*\*\*\*\*\*",  
          "location": "253 followers Detroit, MI",  
          "name": "Nithin G\*\*\*\*m",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*a6"  
        },  
        {  
          "about": "Mai\*\*\*ide\*\*\*edi\*\*\*\*\*\*\*\*\*r",  
          "location": "383 followers Jericho, NY",  
          "name": "Bilal M\*\*\*k",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*"  
        },  
        {  
          "about": "Jam\*\*\*a H\*\*\*ita\*\*\*",  
          "location": "371 followers New York, NY",  
          "name": "Aditya M\*\*\*\*a",  
          "profile\_link": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*72"  
        }  
      \],  
      "educations\_details": null,  
      "education": null,  
      "recommendations\_count": null,  
      "avatar": "https://static.licdn.com/aero-v1/sc/h/9c8pery4andzj6ohjkjp54ma2",  
      "courses": null,  
      "languages": null,  
      "certifications": null,  
      "recommendations": null,  
      "volunteer\_experience": null,  
      "followers": 42,  
      "connections": 41,  
      "current\_company\_company\_id": "marshfield-clinic-health-system",  
      "current\_company\_name": "Marshfield Clinic",  
      "publications": null,  
      "patents": null,  
      "projects": null,  
      "organizations": null,  
      "location": "Marshfield",  
      "input\_url": "htt\*\*\*//w\*\*\*lin\*\*\*\*\*\*\*\*\*/in\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*6a",  
      "linkedin\_id": "bud\*\*\*eie\*\*\*d-a\*\*\*\*\*\*\*\*\*",  
      "activity": null,  
      "linkedin\_num\_id": "245026690",  
      "banner\_image": "https://static.licdn.com/aero-v1/sc/h/5q92mjc5c51bjlwaj3rs9aa82",  
      "honors\_and\_awards": null,  
      "similar\_profiles": \[\],  
      "default\_avatar": true,  
      "memorialized\_account": false,  
      "bio\_links": \[\],  
      "first\_name": "Bud\*\*\*eie\*\*\*",  
      "last\_name": "\*\*\*\*\*\*",  
      "influencer": false  
    }  
  \]  
  \`\`\`  
\</ResponseExample\>

\#\# OpenAPI

\`\`\`\`yaml api-reference/sdk-specs/linkedin-profiles-collect-by-url POST /datasets/v3/scrape  
openapi: 3.0.0  
info:  
  title: Collect LinkedIn Profiles by URL  
  version: 1.0.0  
servers:  
  \- url: https://api.brightdata.com  
security: \[\]  
paths:  
  /datasets/v3/scrape:  
    post:  
      summary: Collect LinkedIn Profiles by URL  
      description: \>-  
        Collect LinkedIn profile data by URL using the Bright Data Web Scraper  
        API (dataset ID gd\_l1viktl72bvl7bjuj0): work history, education, skills  
        and connections.  
      parameters:  
        \- in: query  
          name: dataset\_id  
          required: true  
          schema:  
            type: string  
            default: gd\_l1viktl72bvl7bjuj0  
          description: Must be \`gd\_l1viktl72bvl7bjuj0\` for this dataset.  
        \- in: query  
          name: notify  
          required: false  
          schema:  
            type: boolean  
            default: false  
          description: Send notifications when the request is completed.  
        \- in: query  
          name: include\_errors  
          required: false  
          schema:  
            type: boolean  
            default: true  
          description: Include errors in the response.  
      requestBody:  
        required: true  
        content:  
          application/json:  
            schema:  
              type: object  
              required:  
                \- input  
              properties:  
                input:  
                  type: array  
                  description: \>-  
                    Array of input objects. See \`Request Body\` below for the  
                    supported fields.  
                  items:  
                    type: object  
                    required:  
                      \- url  
                    properties:  
                      url:  
                        type: string  
                        example: https://www.linkedin.com/in/satyanadella/  
      responses:  
        '200':  
          description: OK. See response example below the parameters.  
          content:  
            application/json:  
              schema:  
                type: array  
                items:  
                  type: object  
      x-codeSamples:  
        \- lang: shell  
          label: cURL  
          source: |-  
            curl \--request POST \\  
              \--url 'https://api.brightdata.com/datasets/v3/scrape?dataset\_id=gd\_l1viktl72bvl7bjuj0\&include\_errors=true' \\  
              \--header "Authorization: Bearer YOUR\_API\_KEY" \\  
              \--header "Content-Type: application/json" \\  
              \--data '{"input": \[{"url": "https://www.linkedin.com/in/elad-moshe-05a90413/"}, {"url": "https://www.linkedin.com/in/jonathan-myrvik-3baa01109"}, {"url": "https://www.linkedin.com/in/aviv-tal-75b81/"}, {"url": "https://www.linkedin.com/in/bulentakar/"}\]}'  
        \- lang: python  
          label: Python  
          source: \>-  
            import requests

            url \=  
            "https://api.brightdata.com/datasets/v3/scrape?dataset\_id=gd\_l1viktl72bvl7bjuj0\&include\_errors=true"

            headers \= {  
                "Authorization": "Bearer YOUR\_API\_KEY",  
                "Content-Type": "application/json",  
            }

            payload \= {  
                "input": \[  
                    {  
                        "url": "https://www.linkedin.com/in/elad-moshe-05a90413/"  
                    },  
                    {  
                        "url": "https://www.linkedin.com/in/jonathan-myrvik-3baa01109"  
                    },  
                    {  
                        "url": "https://www.linkedin.com/in/aviv-tal-75b81/"  
                    },  
                    {  
                        "url": "https://www.linkedin.com/in/bulentakar/"  
                    }  
                \]  
            }

            response \= requests.post(url, headers=headers, json=payload)

            print(response.text)  
        \- lang: py  
          label: Python SDK  
          source: |-  
            \# Install: pip install brightdata-sdk  
            from brightdata import BrightDataClient

            async with BrightDataClient(api\_key="YOUR\_API\_KEY") as client:  
                result \= await client.scrape.linkedin.profiles(url="https://www.linkedin.com/in/satyanadella/")  
                print(result.data)  
        \- lang: javascript  
          label: JavaScript  
          source: \>-  
            const response \= await  
            fetch("https://api.brightdata.com/datasets/v3/scrape?dataset\_id=gd\_l1viktl72bvl7bjuj0\&include\_errors=true",  
            {  
              method: "POST",  
              headers: {  
                "Authorization": "Bearer YOUR\_API\_KEY",  
                "Content-Type": "application/json",  
              },  
              body: JSON.stringify({  
                "input": \[  
                    {  
                        "url": "https://www.linkedin.com/in/elad-moshe-05a90413/"  
                    },  
                    {  
                        "url": "https://www.linkedin.com/in/jonathan-myrvik-3baa01109"  
                    },  
                    {  
                        "url": "https://www.linkedin.com/in/aviv-tal-75b81/"  
                    },  
                    {  
                        "url": "https://www.linkedin.com/in/bulentakar/"  
                    }  
                \]  
            }),

            });

            const data \= await response.text();

            console.log(data);  
        \- lang: js  
          label: JavaScript SDK  
          source: \>-  
            // Install: npm install @brightdata/sdk

            import { bdclient } from '@brightdata/sdk';

            const client \= new bdclient({ apiKey: 'YOUR\_API\_KEY' });

            const result \= await  
            client.scrape.linkedin.collectProfiles(\['https://www.linkedin.com/in/satyanadella/'\]);

            console.log(result);

            await client.close();  
        \- lang: php  
          label: PHP  
          source: \>-  
            \<?php

            $ch \=  
            curl\_init("https://api.brightdata.com/datasets/v3/scrape?dataset\_id=gd\_l1viktl72bvl7bjuj0\&include\_errors=true");

            curl\_setopt($ch, CURLOPT\_CUSTOMREQUEST, "POST");

            curl\_setopt($ch, CURLOPT\_RETURNTRANSFER, true);

            curl\_setopt($ch, CURLOPT\_HTTPHEADER, \[  
                "Authorization: Bearer YOUR\_API\_KEY",  
                "Content-Type: application/json",  
            \]);

            curl\_setopt($ch, CURLOPT\_POSTFIELDS, json\_encode(\[  
                "input" \=\> \[  
                    \[  
                        "url" \=\> "https://www.linkedin.com/in/elad-moshe-05a90413/"  
                    \],  
                    \[  
                        "url" \=\> "https://www.linkedin.com/in/jonathan-myrvik-3baa01109"  
                    \],  
                    \[  
                        "url" \=\> "https://www.linkedin.com/in/aviv-tal-75b81/"  
                    \],  
                    \[  
                        "url" \=\> "https://www.linkedin.com/in/bulentakar/"  
                    \]  
                \]  
            \]));

            $response \= curl\_exec($ch);

            curl\_close($ch);

            echo $response;  
        \- lang: go  
          label: Go  
          source: "package main\\n\\nimport (\\n\\t\\"bytes\\"\\n\\t\\"fmt\\"\\n\\t\\"io\\"\\n\\t\\"net/http\\"\\n)\\n\\nfunc main() {\\n\\tpayload := \[\]byte(\\"{\\\\\\"input\\\\\\": \[{\\\\\\"url\\\\\\": \\\\\\"https://www.linkedin.com/in/elad-moshe-05a90413/\\\\\\"}, {\\\\\\"url\\\\\\": \\\\\\"https://www.linkedin.com/in/jonathan-myrvik-3baa01109\\\\\\"}, {\\\\\\"url\\\\\\": \\\\\\"https://www.linkedin.com/in/aviv-tal-75b81/\\\\\\"}, {\\\\\\"url\\\\\\": \\\\\\"https://www.linkedin.com/in/bulentakar/\\\\\\"}\]}\\")\\n\\treq, \_ := http.NewRequest(\\"POST\\", \\"https://api.brightdata.com/datasets/v3/scrape?dataset\_id=gd\_l1viktl72bvl7bjuj0\&include\_errors=true\\", bytes.NewBuffer(payload))\\n\\treq.Header.Set(\\"Authorization\\", \\"Bearer YOUR\_API\_KEY\\")\\n\\treq.Header.Set(\\"Content-Type\\", \\"application/json\\")\\n\\n\\tres, err := http.DefaultClient.Do(req)\\n\\tif err \!= nil { panic(err) }\\n\\tdefer res.Body.Close()\\n\\n\\tbody, \_ := io.ReadAll(res.Body)\\n\\tfmt.Println(string(body))\\n}"  
        \- lang: java  
          label: Java  
          source: |-  
            import java.net.URI;  
            import java.net.http.HttpClient;  
            import java.net.http.HttpRequest;  
            import java.net.http.HttpResponse;

            public class Main {  
                public static void main(String\[\] args) throws Exception {  
                    String body \= "{\\"input\\": \[{\\"url\\": \\"https://www.linkedin.com/in/elad-moshe-05a90413/\\"}, {\\"url\\": \\"https://www.linkedin.com/in/jonathan-myrvik-3baa01109\\"}, {\\"url\\": \\"https://www.linkedin.com/in/aviv-tal-75b81/\\"}, {\\"url\\": \\"https://www.linkedin.com/in/bulentakar/\\"}\]}";  
                    HttpRequest request \= HttpRequest.newBuilder()  
                        .uri(URI.create("https://api.brightdata.com/datasets/v3/scrape?dataset\_id=gd\_l1viktl72bvl7bjuj0\&include\_errors=true"))  
                        .header("Authorization", "Bearer YOUR\_API\_KEY")  
                        .header("Content-Type", "application/json")  
                        .method("POST", HttpRequest.BodyPublishers.ofString(body))  
                        .build();

                    HttpResponse\<String\> response \= HttpClient.newHttpClient()  
                        .send(request, HttpResponse.BodyHandlers.ofString());  
                    System.out.println(response.body());  
                }  
            }  
        \- lang: ruby  
          label: Ruby  
          source: \>-  
            require 'net/http'

            require 'json'

            require 'uri'

            uri \=  
            URI.parse("https://api.brightdata.com/datasets/v3/scrape?dataset\_id=gd\_l1viktl72bvl7bjuj0\&include\_errors=true")

            request \= Net::HTTP::Post.new(uri)

            request\["Authorization"\] \= "Bearer YOUR\_API\_KEY"

            request\["Content-Type"\] \= "application/json"

            request.body \= {"input": \[{"url":  
            "https://www.linkedin.com/in/elad-moshe-05a90413/"}, {"url":  
            "https://www.linkedin.com/in/jonathan-myrvik-3baa01109"}, {"url":  
            "https://www.linkedin.com/in/aviv-tal-75b81/"}, {"url":  
            "https://www.linkedin.com/in/bulentakar/"}\]}.to\_json

            response \= Net::HTTP.start(uri.hostname, uri.port, use\_ssl: true) {  
            |http| http.request(request) }

            puts response.body

\`\`\`\`

\> \#\# Documentation Index  
\> Fetch the complete documentation index at: https://docs.brightdata.com/llms.txt  
\> Use this file to discover all available pages before exploring further.

\# LinkedIn Scraper Quickstart

\> Set up the Bright Data LinkedIn Scraper API and collect your first profile, company or job as structured JSON in under 5 minutes from the Control Panel.

This tutorial shows you how to scrape a LinkedIn profile and get structured JSON data using the Bright Data LinkedIn Scraper API.

\#\# Prerequisites

\* A \[Bright Data account\](https://brightdata.com/cp/start) (includes \\$2 free credit)  
\* cURL, Python 3, or Node.js 18+ installed

\<Steps\>  
  \<Step title="Get your API key"\>  
    Go to the \[user settings page\](https://brightdata.com/cp/setting/users) in your Bright Data account and copy your API key.

    If you don't have an account yet, \[sign up at brightdata.com\](https://brightdata.com/cp/start). New users get \\$2 free credit for testing.

    \<Warning\>  
      Your API key is shown only once when created. Copy and store it securely.  
    \</Warning\>  
  \</Step\>

  \<Step title="Send a request"\>  
    We'll use the \*\*Profiles endpoint\*\* with a synchronous request. Replace \`YOUR\_API\_KEY\` with your actual token:

    \<CodeGroup\>  
      \`\`\`bash cURL theme={null}  
      curl \-X POST \\  
        "https://api.brightdata.com/datasets/v3/scrape?dataset\_id=gd\_l1viktl72bvl7bjuj0\&format=json" \\  
        \-H "Authorization: Bearer YOUR\_API\_KEY" \\  
        \-H "Content-Type: application/json" \\  
        \-d '\[{"url": "https://www.linkedin.com/in/satyanadella"}\]'  
      \`\`\`

      \`\`\`python Python theme={null}  
      import requests

      response \= requests.post(  
          "https://api.brightdata.com/datasets/v3/scrape",  
          params={"dataset\_id": "gd\_l1viktl72bvl7bjuj0", "format": "json"},  
          headers={  
              "Authorization": "Bearer YOUR\_API\_KEY",  
              "Content-Type": "application/json",  
          },  
          json=\[{"url": "https://www.linkedin.com/in/satyanadella"}\],  
      )

      print(response.json())  
      \`\`\`

      \`\`\`javascript Node.js theme={null}  
      const response \= await fetch(  
        "https://api.brightdata.com/datasets/v3/scrape?dataset\_id=gd\_l1viktl72bvl7bjuj0\&format=json",  
        {  
          method: "POST",  
          headers: {  
            "Authorization": "Bearer YOUR\_API\_KEY",  
            "Content-Type": "application/json",  
          },  
          body: JSON.stringify(\[  
            { url: "https://www.linkedin.com/in/satyanadella" }  
          \]),  
        }  
      );

      const data \= await response.json();  
      console.log(data);  
      \`\`\`  
    \</CodeGroup\>

    You should see a \`200\` status code. This takes 10-30 seconds.  
  \</Step\>

  \<Step title="Review the response"\>  
    The Bright Data LinkedIn Scraper API returns a JSON array with structured profile data:

    \`\`\`json theme={null}  
    \[  
      {  
        "name": "Satya Nadella",  
        "city": "Redmond",  
        "country\_code": "US",  
        "position": "Chairman and CEO at Microsoft",  
        "current\_company": {  
          "name": "Microsoft",  
          "link": "https://www.linkedin.com/company/microsoft"  
        },  
        "followers": 10842560,  
        "connections": 500,  
        "url": "https://www.linkedin.com/in/satyanadella"  
      }  
    \]  
    \`\`\`

    Each profile object includes 50+ fields covering personal details, work history, education, skills, and social activity. See the \[full response schema\](/api-reference/scrapers/social-media-apis/linkedin-profiles-collect-by-url).  
  \</Step\>  
\</Steps\>

You've successfully scraped your first LinkedIn profile using the Bright Data LinkedIn Scraper API.

\#\# Common questions

\<Accordion title="Can I scrape multiple profiles in one request?"\>  
  Yes. Add more objects to the input array. Synchronous requests support up to 20 URLs. For larger batches, use the \[async \`/trigger\` endpoint\](/datasets/scrapers/linkedin/async-requests).

  \`\`\`json theme={null}  
  \[  
    {"url": "https://www.linkedin.com/in/satyanadella"},  
    {"url": "https://www.linkedin.com/in/jeffweiner08"},  
    {"url": "https://www.linkedin.com/in/rbranson"}  
  \]  
  \`\`\`  
\</Accordion\>

\<Accordion title="Getting a 401 or 403 error?"\>  
  Verify your API key is correct and hasn't expired. Generate a new token from \[Account settings\](https://brightdata.com/cp/setting/users). See the \[authentication guide\](/api-reference/authentication) for details.  
\</Accordion\>

\<Accordion title="Request is timing out?"\>  
  Synchronous requests have a 1-minute timeout. If the request exceeds this limit, it automatically switches to async and returns a \`snapshot\_id\`. Use the \[async workflow\](/datasets/scrapers/linkedin/async-requests) for large batches.  
\</Accordion\>

\<Accordion title="Empty or partial response data?"\>  
  Verify the LinkedIn profile URL is publicly accessible and correctly formatted. The URL should follow the pattern \`https://www.linkedin.com/in/username\`.  
\</Accordion\>

\#\# Next steps

\<CardGroup cols={3}\>  
  \<Card title="Send your first request" icon="bolt" href="/datasets/scrapers/linkedin/send-first-request"\>  
    Explore all four endpoint types with full examples.  
  \</Card\>

  \<Card title="Async batch requests" icon="layer-group" href="/datasets/scrapers/linkedin/async-requests"\>  
    Scrape hundreds of URLs in a single batch job.  
  \</Card\>

  \<Card title="Set up webhooks" icon="webhook" href="/datasets/scrapers/linkedin/data-delivery/webhooks"\>  
    Receive results automatically when scraping completes.  
  \</Card\>  
\</CardGroup\>

\> \#\# Documentation Index  
\> Fetch the complete documentation index at: https://docs.brightdata.com/llms.txt  
\> Use this file to discover all available pages before exploring further.

\# LinkedIn Scraper API

\> Use the Bright Data LinkedIn Scraper API to extract structured data from profiles, companies, jobs and posts. Handles up to 20 URLs per request.

Send a LinkedIn URL, get structured JSON back. The Bright Data LinkedIn Scraper API handles proxies, CAPTCHAs, and parsing so you can focus on your data pipeline.

\<Tip\>  
  New to Bright Data? \[Create a free account\](https://brightdata.com/cp/start) and get \\$2 credit to start scraping.  
\</Tip\>

\#\# How it works

You send one or more LinkedIn URLs to the Bright Data LinkedIn Scraper API. Bright Data handles the scraping infrastructure and returns clean, structured JSON.

\`\`\`text theme={null}  
Your app  \--\>  Bright Data API  \--\>  Structured JSON  
           POST /datasets/v3/scrape  
           Authorization: Bearer YOUR\_API\_KEY  
\`\`\`

All requests use a \`dataset\_id\` to specify the data type (profiles, companies, jobs, or posts) and return results in JSON, NDJSON, or CSV.

\#\# What the response looks like

\`\`\`bash theme={null}  
curl \-X POST "https://api.brightdata.com/datasets/v3/scrape?dataset\_id=gd\_l1viktl72bvl7bjuj0\&format=json" \\  
  \-H "Authorization: Bearer YOUR\_API\_KEY" \\  
  \-H "Content-Type: application/json" \\  
  \-d '\[{"url": "https://www.linkedin.com/in/satyanadella"}\]'  
\`\`\`

\`\`\`json theme={null}  
{  
  "name": "Satya Nadella",  
  "city": "Redmond",  
  "country\_code": "US",  
  "current\_company": { "name": "Microsoft" },  
  "followers": 10842560,  
  "about": "Chairman and CEO at Microsoft..."  
}  
\`\`\`

\#\# Supported data types

\<CardGroup cols={2}\>  
  \<Card title="Profiles" icon="user" href="/api-reference/scrapers/social-media-apis/linkedin-profiles-collect-by-url"\>  
    Work history, education, skills, connections. Discover profiles by name or keyword.  
  \</Card\>

  \<Card title="Companies" icon="building" href="/api-reference/scrapers/social-media-apis/linkedin-companies-collect-by-url"\>  
    Employee counts, funding data, specialties, affiliated organizations.  
  \</Card\>

  \<Card title="Jobs" icon="briefcase" href="/api-reference/scrapers/social-media-apis/linkedin-jobs-collect-by-url"\>  
    Salary data, requirements, application links. Discover jobs by keyword or search URL.  
  \</Card\>

  \<Card title="Posts" icon="message" href="/api-reference/scrapers/social-media-apis/linkedin-posts-collect-by-url"\>  
    Post content, engagement metrics, hashtags, comments. Discover posts by company or profile.  
  \</Card\>  
\</CardGroup\>

\#\# Request methods

The Bright Data LinkedIn Scraper API supports two request methods. Choose based on your volume and latency needs.

| Method           | Endpoint                                                    | Best for                                   |  
| :--------------- | :---------------------------------------------------------- | :----------------------------------------- |  
| \*\*Synchronous\*\*  | \[\`/scrape\`\](/datasets/scrapers/linkedin/send-first-request) | Real-time lookups, up to 20 URLs           |  
| \*\*Asynchronous\*\* | \[\`/trigger\`\](/datasets/scrapers/linkedin/async-requests)    | Batch jobs, 20+ URLs, production pipelines |

Learn more in \[Understanding sync vs. async requests\](/datasets/scrapers/concepts/sync-vs-async).

\#\# Capabilities and limits

| Capability                     | Detail                                                                                                                                                                                                                                     |  
| :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |  
| \*\*Output formats\*\*             | JSON, NDJSON, CSV                                                                                                                                                                                                                          |  
| \*\*Max URLs per sync request\*\*  | 20                                                                                                                                                                                                                                         |  
| \*\*Max URLs per async request\*\* | 5,000                                                                                                                                                                                                                                      |  
| \*\*Data freshness\*\*             | Real-time (scraped on demand)                                                                                                                                                                                                              |  
| \*\*Delivery options\*\*           | API download, \[Webhook\](/datasets/scrapers/linkedin/data-delivery/webhooks), \[Amazon S3\](/datasets/scrapers/linkedin/data-delivery/amazon-s3), Snowflake, Azure, GCS (\[all options\](/datasets/scrapers/scrapers-library/delivery-options)) |  
| \*\*Pricing\*\*                    | Pay per successful record (\[see pricing\](https://brightdata.com/pricing/web-scraper))                                                                                                                                                      |

\#\# Common questions

\<Accordion title="Is the data scraped in real time?"\>  
  Yes. Each request triggers a live scrape. There is no cached or stale data. Response times vary by endpoint: profiles typically return in 10-30 seconds (sync), while discovery requests may take longer depending on result volume.  
\</Accordion\>

\<Accordion title="What is the difference between URL collection and discovery?"\>  
  \*\*URL collection\*\* scrapes a specific LinkedIn page you provide (e.g., a profile URL). \*\*Discovery\*\* finds LinkedIn pages matching search criteria (e.g., "software engineers in San Francisco") and scrapes the results. Discovery is only available via async requests.  
\</Accordion\>

\<Accordion title="How is this different from scraping using proxies or Web Unlocker?"\>  
  When scraping using proxies or Web Unlocker, you still need to write and maintain  
  your own parsing logic and update it whenever LinkedIn changes its page structure.  
  The LinkedIn Scraper API handles the entire stack: proxy rotation, anti-bot bypassing  
  and parsing. You simply send a LinkedIn URL and get clean, structured JSON back with  
  no scraping infrastructure or parser maintenance required on your end.  
\</Accordion\>

\#\# Next steps

\<CardGroup cols={3}\>  
  \<Card title="Quickstart" icon="rocket" href="/datasets/scrapers/linkedin/quickstart"\>  
    Scrape your first LinkedIn profile in 5 minutes.  
  \</Card\>

  \<Card title="Send your first request" icon="bolt" href="/datasets/scrapers/linkedin/send-first-request"\>  
    Full code examples in cURL, Python, and Node.js.  
  \</Card\>

  \<Card title="API reference" icon="code" href="/api-reference/scrapers/social-media-apis/linkedin-profiles-collect-by-url"\>  
    Endpoint specs, parameters, and response schemas.  
  \</Card\>  
\</CardGroup\>

\> \#\# Documentation Index  
\> Fetch the complete documentation index at: https://docs.brightdata.com/llms.txt  
\> Use this file to discover all available pages before exploring further.

\# LinkedIn data collection options

\> Compare 3 LinkedIn data options from Bright Data: Scraper API (real-time URL scraping), Dataset Marketplace (bulk), and Deep Lookup (AI entity search).

Bright Data offers three ways to collect LinkedIn data. Each serves a different use case: real-time scraping by URL, bulk pre-collected datasets, or AI-powered entity search. This guide helps you choose the right one.

\#\# How the three options compare

|                            | LinkedIn Scraper API                               | Dataset Marketplace                             | Deep Lookup                                         |  
| :------------------------- | :------------------------------------------------- | :---------------------------------------------- | :-------------------------------------------------- |  
| \*\*What you provide\*\*       | LinkedIn URLs                                      | Filter criteria (job title, location, industry) | Natural language query ("Find all CTOs in fintech") |  
| \*\*What you get back\*\*      | Structured data per URL (JSON, NDJSON, JSONL, CSV) | Bulk dataset (CSV, JSON)                        | Structured results with source attribution          |  
| \*\*Data freshness\*\*         | Real-time (scraped on demand)                      | Pre-collected, refreshed periodically           | Real-time search across 1,000+ sources              |  
| \*\*Data types\*\*             | Profiles, Companies, Jobs, Posts                   | People profiles, Company info, Posts            | People, Companies, Products, News, Events           |  
| \*\*Volume\*\*                 | 1-5,000 URLs per request                           | Millions of records available                   | Varies by query complexity                          |  
| \*\*Email/phone enrichment\*\* | No                                                 | Yes (via RevenueBase partnership)               | Yes (built-in)                                      |  
| \*\*Best for\*\*               | Scraping specific URLs you already have            | Large-scale research with demographic filters   | Finding entities that match specific criteria       |  
| \*\*Pricing model\*\*          | Per successful record                              | Per record (volume discounts)                   | Per matched result                                  |

\#\# LinkedIn Scraper API

The \[LinkedIn Scraper API\](/datasets/scrapers/linkedin/introduction) is the best option when you already have LinkedIn URLs and need fresh, structured data for each one.

You send a \`POST\` request with one or more URLs, and the API returns structured JSON with 50+ fields per profile. Bright Data handles proxy rotation, anti-bot bypassing, and HTML parsing.

\*\*Supported endpoints:\*\*

\* \[Profiles\](/api-reference/scrapers/social-media-apis/linkedin-profiles-collect-by-url) \- work history, education, skills, connections  
\* \[Companies\](/api-reference/scrapers/social-media-apis/linkedin-companies-collect-by-url) \- employee counts, funding, specialties  
\* \[Jobs\](/api-reference/scrapers/social-media-apis/linkedin-jobs-collect-by-url) \- salary, requirements, application links  
\* \[Posts\](/api-reference/scrapers/social-media-apis/linkedin-posts-collect-by-url) \- content, engagement metrics, hashtags

\*\*Example:\*\*

\`\`\`bash theme={null}  
curl \-X POST \\  
  "https://api.brightdata.com/datasets/v3/scrape?dataset\_id=gd\_l1viktl72bvl7bjuj0\&format=json" \\  
  \-H "Authorization: Bearer YOUR\_API\_KEY" \\  
  \-H "Content-Type: application/json" \\  
  \-d '\[{"url": "https://www.linkedin.com/in/satyanadella"}\]'  
\`\`\`

\*\*When to use it:\*\*

\* You have a list of LinkedIn profile, company, job, or post URLs  
\* You need real-time, fresh data (not cached or pre-collected)  
\* You want to integrate LinkedIn data into an automated pipeline  
\* You need data for a specific, known set of entities

\<Card title="Get started" icon="rocket" href="/datasets/scrapers/linkedin/quickstart"\>  
  Scrape your first LinkedIn profile in 5 minutes.  
\</Card\>

\#\# When to use Dataset Marketplace

The \[Dataset Marketplace\](/datasets/marketplace/overview) offers pre-collected LinkedIn datasets that you can filter and purchase in bulk. This is ideal when you need large volumes of data but don't have specific URLs.

\*\*Available LinkedIn datasets:\*\*

\* \*\*LinkedIn People Profiles\*\* \- 669M+ records with professional details  
\* \*\*LinkedIn Company Information\*\* \- company profiles with firmographic data  
\* \*\*LinkedIn Posts\*\* \- post content and engagement metrics

You browse the marketplace, apply filters (job title, location, industry, company size), preview a sample, and purchase the matching records.

\*\*Email and phone enrichment:\*\* Standard LinkedIn profiles do not include email addresses or phone numbers. However, the marketplace offers an enriched business contact option (via RevenueBase partnership) that adds GDPR-compliant business emails and phone numbers where available. Use the \*\*Contact filters\*\* button in the Dataset Marketplace view to enable this.

\*\*When to use it:\*\*

\* You need thousands or millions of records matching demographic criteria  
\* You don't have specific URLs, just filter criteria (e.g., "marketing directors in Germany")  
\* You need enriched contact information (business email, phone)  
\* You want a one-time data purchase or recurring delivery

\<Card title="Browse LinkedIn datasets" icon="database" href="/datasets/marketplace/overview"\>  
  Filter, preview, and purchase pre-collected LinkedIn data.  
\</Card\>

\#\# When to use Deep Lookup

\[Deep Lookup\](/datasets/deep-lookup/overview) is an AI-powered research tool that searches 1,000+ public sources to find entities matching your criteria. Unlike the Scraper API (which requires URLs) or the Marketplace (which uses predefined filters), Deep Lookup accepts natural language queries.

\*\*Example queries:\*\*

\* "Find all VP of Engineering at Series B+ startups in Austin, TX"  
\* "Find all SaaS companies with 50-200 employees that raised funding in 2025"

Deep Lookup validates results across multiple sources for 95%+ accuracy, and can enrich results with contact information, technology stacks, funding data, and social profiles.

\*\*When to use it:\*\*

\* You need to discover entities matching complex, specific criteria  
\* You want AI-validated results with source attribution  
\* You need enrichment columns added dynamically (email, revenue, tech stack)  
\* Your research question doesn't map to simple URL scraping or marketplace filters

\<Card title="Try Deep Lookup" icon="magnifying-glass" href="/datasets/deep-lookup/overview"\>  
  Search the public web like a database using natural language.  
\</Card\>

\#\# Which option should I use?

| Scenario                                                                  | Recommended option                                                                    |  
| :------------------------------------------------------------------------ | :------------------------------------------------------------------------------------ |  
| "I have 500 LinkedIn profile URLs and need their work history"            | \*\*LinkedIn Scraper API\*\* \- send URLs, get structured JSON                             |  
| "I need 10,000 marketing directors in the US with email addresses"        | \*\*Dataset Marketplace\*\* \- filter by job title and location, enable contact enrichment |  
| "Find all CTOs at AI startups in Europe who previously worked at Google"  | \*\*Deep Lookup\*\* \- complex criteria best suited for AI-powered search                  |  
| "I want to monitor job postings from 50 companies weekly"                 | \*\*LinkedIn Scraper API\*\* (async) \- schedule recurring scrapes using the Jobs endpoint |  
| "I need a one-time export of all LinkedIn company profiles in healthcare" | \*\*Dataset Marketplace\*\* \- filter by industry, purchase in bulk                        |

\#\# Data access limitations

All three options collect \*\*publicly available data only\*\*. Bright Data does not access data behind LinkedIn's login wall.

This means:

\* \*\*Available\*\*: Public profile details (name, headline, current position, education, skills, follower count), public company pages, public job listings, public posts  
\* \*\*Not available\*\*: Private profiles, connection lists, direct messages, InMail content, data visible only to logged-in users or 1st/2nd-degree connections

If a LinkedIn profile is set to private or restricted, the Scraper API returns only the publicly visible fields.

\#\# Common questions

\<AccordionGroup\>  
  \<Accordion title="Can I get email addresses from LinkedIn profiles?"\>  
    The LinkedIn Scraper API does not return email addresses because they are not publicly displayed on LinkedIn. For business contact enrichment, use the \*\*Dataset Marketplace\*\* with the Contact filters option enabled (via RevenueBase partnership), or use \*\*Deep Lookup\*\* which can search for contact information across multiple public sources.  
  \</Accordion\>

  \<Accordion title="How fresh is the data in the Dataset Marketplace?"\>  
    Marketplace datasets are pre-collected and refreshed periodically. If you need guaranteed real-time data, use the LinkedIn Scraper API, which scrapes on demand with every request.  
  \</Accordion\>

  \<Accordion title="Can I combine multiple options?"\>  
    Yes. A common workflow is to use \*\*Deep Lookup\*\* or the \*\*Dataset Marketplace\*\* to discover relevant LinkedIn URLs, then feed those URLs into the \*\*LinkedIn Scraper API\*\* for real-time, detailed scraping.  
  \</Accordion\>

  \<Accordion title="What output formats are supported?"\>  
    \* \*\*LinkedIn Scraper API\*\*: JSON, NDJSON, JSONL, CSV (delivered via API, webhook, S3, or other storage)  
    \* \*\*Dataset Marketplace\*\*: CSV, JSON (downloaded or delivered to your storage)  
    \* \*\*Deep Lookup\*\*: Structured results viewable in the control panel or exported  
  \</Accordion\>

  \<Accordion title="Is there a free trial?"\>  
    New Bright Data accounts receive \\$2 in free credit, which can be used with any of the three options. The Dataset Marketplace and Deep Lookup also offer free sample previews before purchase.  
  \</Accordion\>  
\</AccordionGroup\>

\> \#\# Documentation Index  
\> Fetch the complete documentation index at: https://docs.brightdata.com/llms.txt  
\> Use this file to discover all available pages before exploring further.

\# How to receive LinkedIn data via webhooks

\> Configure the Bright Data LinkedIn Scraper API to push scraped profiles, companies, jobs and posts to your HTTPS webhook across 4 endpoints as jobs complete.

This guide shows you how to set up webhook delivery so your server receives scraped LinkedIn data automatically when a collection job finishes.

\#\# Prerequisites

\* A \[Bright Data account\](https://brightdata.com/cp/start) with an active API key  
\* Familiarity with the \[async request workflow\](/datasets/scrapers/linkedin/async-requests)  
\* A publicly accessible HTTP endpoint (or a testing tool like \[webhook.site\](https://webhook.site))

\#\# How webhooks work

When you trigger an async collection with a \`webhook\` URL, Bright Data sends a \`POST\` request to your endpoint with the scraped data once the job completes. No polling required.

\`\`\`text theme={null}  
Your app \--\> POST /trigger (with webhook URL) \--\> Bright Data scrapes \--\> POST to your webhook  
\`\`\`

\#\# Step 1: Set up a test webhook

For testing, use \[webhook.site\](https://webhook.site) to get a temporary public URL:

1\. Open \[webhook.site\](https://webhook.site) in your browser  
2\. Copy the unique URL displayed (e.g., \`https://webhook.site/abc-123-def\`)  
3\. Keep the page open to monitor incoming requests

\#\# Step 2: Trigger a collection with the webhook URL

Add the \`webhook\` query parameter to your async \`/trigger\` request:

\<CodeGroup\>  
  \`\`\`bash cURL theme={null}  
  curl \-X POST \\  
    "https://api.brightdata.com/datasets/v3/trigger?dataset\_id=gd\_l1viktl72bvl7bjuj0\&format=json\&webhook=https://webhook.site/abc-123-def\&uncompressed\_webhook=true" \\  
    \-H "Authorization: Bearer YOUR\_API\_KEY" \\  
    \-H "Content-Type: application/json" \\  
    \-d '\[  
      {"url": "https://www.linkedin.com/in/satyanadella"},  
      {"url": "https://www.linkedin.com/in/jeffweiner08"}  
    \]'  
  \`\`\`

  \`\`\`python Python theme={null}  
  import requests

  WEBHOOK\_URL \= "https://webhook.site/abc-123-def"

  response \= requests.post(  
      "https://api.brightdata.com/datasets/v3/trigger",  
      params={  
          "dataset\_id": "gd\_l1viktl72bvl7bjuj0",  
          "format": "json",  
          "webhook": WEBHOOK\_URL,  
          "uncompressed\_webhook": "true",  
      },  
      headers={  
          "Authorization": "Bearer YOUR\_API\_KEY",  
          "Content-Type": "application/json",  
      },  
      json=\[  
          {"url": "https://www.linkedin.com/in/satyanadella"},  
          {"url": "https://www.linkedin.com/in/jeffweiner08"},  
      \],  
  )

  print("Snapshot ID:", response.json()\["snapshot\_id"\])  
  \`\`\`

  \`\`\`javascript Node.js theme={null}  
  const WEBHOOK\_URL \= "https://webhook.site/abc-123-def";

  const response \= await fetch(  
    \`https://api.brightdata.com/datasets/v3/trigger?dataset\_id=gd\_l1viktl72bvl7bjuj0\&format=json\&webhook=${encodeURIComponent(WEBHOOK\_URL)}\&uncompressed\_webhook=true\`,  
    {  
      method: "POST",  
      headers: {  
        "Authorization": "Bearer YOUR\_API\_KEY",  
        "Content-Type": "application/json",  
      },  
      body: JSON.stringify(\[  
        { url: "https://www.linkedin.com/in/satyanadella" },  
        { url: "https://www.linkedin.com/in/jeffweiner08" },  
      \]),  
    }  
  );

  const data \= await response.json();  
  console.log("Snapshot ID:", data.snapshot\_id);  
  \`\`\`  
\</CodeGroup\>

Key parameters:

| Parameter              | Description                                                  |  
| :--------------------- | :----------------------------------------------------------- |  
| \`webhook\`              | Your HTTP endpoint URL that receives the \`POST\` payload      |  
| \`uncompressed\_webhook\` | Set to \`true\` to receive uncompressed JSON (default is gzip) |  
| \`format\`               | Output format: \`json\`, \`ndjson\`, or \`csv\`                    |

\#\# Step 3: Verify delivery

Once the collection completes (typically 30-60 seconds for a few profiles), check your webhook.site page. You should see a \`POST\` request with the scraped data.

The payload is the same JSON array you would receive from a direct API download:

\`\`\`json theme={null}  
\[  
  {  
    "name": "Satya Nadella",  
    "city": "Redmond",  
    "country\_code": "US",  
    "current\_company": { "name": "Microsoft" },  
    "followers": 10842560  
  },  
  {  
    "name": "Jeff Weiner",  
    "city": "San Francisco Bay Area",  
    "country\_code": "US",  
    "current\_company": { "name": "Next Chapter" },  
    "followers": 1200000  
  }  
\]  
\`\`\`

\#\# Production webhook setup

For production, point the \`webhook\` URL to your own server endpoint.

\#\#\# How to handle webhooks in Express.js

\`\`\`javascript server.js theme={null}  
const express \= require("express");  
const app \= express();

app.use(express.json({ limit: "100mb" }));

app.post("/webhook/linkedin", (req, res) \=\> {  
  const profiles \= req.body;  
  console.log(\`Received ${profiles.length} profiles\`);

  for (const profile of profiles) {  
    console.log(\`- ${profile.name} (${profile.current\_company?.name})\`);  
  }

  res.status(200).json({ received: true });  
});

app.listen(3000, () \=\> console.log("Webhook server running on port 3000"));  
\`\`\`

\#\#\# How to handle webhooks in Flask

\`\`\`python server.py theme={null}  
from flask import Flask, request, jsonify

app \= Flask(\_\_name\_\_)

@app.route("/webhook/linkedin", methods=\["POST"\])  
def handle\_webhook():  
    profiles \= request.get\_json()  
    print(f"Received {len(profiles)} profiles")

    for profile in profiles:  
        print(f"- {profile\['name'\]} ({profile.get('current\_company', {}).get('name')})")

    return jsonify({"received": True}), 200

if \_\_name\_\_ \== "\_\_main\_\_":  
    app.run(port=3000)  
\`\`\`

\<Warning\>  
  Return a \`200\` status code within 30 seconds to acknowledge receipt. If your endpoint fails or times out, Bright Data retries delivery.  
\</Warning\>

\#\# Webhook with authorization

If your endpoint requires authentication, add the \`webhook\_header\_Authorization\` parameter:

\`\`\`bash theme={null}  
curl \-X POST \\  
  "https://api.brightdata.com/datasets/v3/trigger?dataset\_id=gd\_l1viktl72bvl7bjuj0\&format=json\&webhook=https://your-server.com/webhook\&webhook\_header\_Authorization=Bearer+YOUR\_SECRET\_TOKEN" \\  
  \-H "Authorization: Bearer YOUR\_API\_KEY" \\  
  \-H "Content-Type: application/json" \\  
  \-d '\[{"url": "https://www.linkedin.com/in/satyanadella"}\]'  
\`\`\`

\#\# Allowlist webhook IPs

If your server uses an IP allowlist, add the following Bright Data webhook source IPs:

\`\`\`text theme={null}  
54.175.27.69  
34.225.9.175  
100.28.38.247  
100.29.18.195  
52.72.185.255  
35.174.112.248  
54.165.183.124  
3.91.140.7  
52.202.75.37  
98.82.225.117  
100.27.150.189  
18.214.10.85  
35.169.71.210  
44.194.183.74  
\`\`\`

\#\# Troubleshooting

\<Accordion title="Webhook not receiving data?"\>  
  \* Verify the URL is publicly accessible (not \`localhost\`)  
  \* Check that your endpoint returns a \`200\` status code within 30 seconds  
  \* Verify the webhook IPs above are allowlisted if you have firewall rules  
\</Accordion\>

\<Accordion title="Receiving compressed data?"\>  
  If you omit \`uncompressed\_webhook=true\`, data arrives gzip-compressed. Add \`uncompressed\_webhook=true\` to your trigger URL, or decompress the payload on your server.  
\</Accordion\>

\<Accordion title="Payload too large for your server?"\>  
  Large collections can produce payloads up to 1 GB. Set \`express.json({ limit: "100mb" })\` in Express.js or equivalent in your framework. If you need to handle very large datasets, use \[S3 delivery\](/datasets/scrapers/linkedin/data-delivery/amazon-s3) instead.  
\</Accordion\>

\#\# Next steps

\<CardGroup cols={2}\>  
  \<Card title="Deliver to Amazon S3" icon="bucket" href="/datasets/scrapers/linkedin/data-delivery/amazon-s3"\>  
    Store results directly in your S3 bucket.  
  \</Card\>

  \<Card title="All delivery options" icon="truck" href="/datasets/scrapers/scrapers-library/delivery-options"\>  
    Snowflake, Azure, GCS, and more.  
  \</Card\>  
\</CardGroup\>

\> \#\# Documentation Index  
\> Fetch the complete documentation index at: https://docs.brightdata.com/llms.txt  
\> Use this file to discover all available pages before exploring further.

\# How to scrape LinkedIn data in bulk

\> Trigger large-scale LinkedIn scraping jobs, monitor progress, and retrieve results using the Bright Data async /trigger endpoint. Supports batches of 20 URLs.

This guide shows you how to scrape LinkedIn data at scale using the asynchronous \`/trigger\` endpoint. Use this when you have more than 20 URLs, need discovery, or want delivery to a webhook or S3.

\<Tip\>  
  Not sure whether to use sync or async? Read \[Understanding sync vs. async requests\](/datasets/scrapers/concepts/sync-vs-async).  
\</Tip\>

\#\# Prerequisites

\* A \[Bright Data account\](https://brightdata.com/cp/start) with an active API key  
\* Familiarity with the \[synchronous request flow\](/datasets/scrapers/linkedin/send-first-request)

\#\# Step 1: Trigger the collection

Send a \`POST\` request to the \`/trigger\` endpoint with your input URLs:

\<CodeGroup\>  
  \`\`\`bash cURL theme={null}  
  curl \-X POST \\  
    "https://api.brightdata.com/datasets/v3/trigger?dataset\_id=gd\_l1viktl72bvl7bjuj0\&format=json" \\  
    \-H "Authorization: Bearer YOUR\_API\_KEY" \\  
    \-H "Content-Type: application/json" \\  
    \-d '\[  
      {"url": "https://www.linkedin.com/in/satyanadella"},  
      {"url": "https://www.linkedin.com/in/jeffweiner08"},  
      {"url": "https://www.linkedin.com/in/rbranson"},  
      {"url": "https://www.linkedin.com/in/sherylsandberg"},  
      {"url": "https://www.linkedin.com/in/raboram"}  
    \]'  
  \`\`\`

  \`\`\`python Python theme={null}  
  import requests

  response \= requests.post(  
      "https://api.brightdata.com/datasets/v3/trigger",  
      params={  
          "dataset\_id": "gd\_l1viktl72bvl7bjuj0",  
          "format": "json",  
      },  
      headers={  
          "Authorization": "Bearer YOUR\_API\_KEY",  
          "Content-Type": "application/json",  
      },  
      json=\[  
          {"url": "https://www.linkedin.com/in/satyanadella"},  
          {"url": "https://www.linkedin.com/in/jeffweiner08"},  
          {"url": "https://www.linkedin.com/in/rbranson"},  
          {"url": "https://www.linkedin.com/in/sherylsandberg"},  
          {"url": "https://www.linkedin.com/in/raboram"},  
      \],  
  )

  snapshot \= response.json()  
  print("Snapshot ID:", snapshot\["snapshot\_id"\])  
  \`\`\`

  \`\`\`javascript Node.js theme={null}  
  const response \= await fetch(  
    "https://api.brightdata.com/datasets/v3/trigger?dataset\_id=gd\_l1viktl72bvl7bjuj0\&format=json",  
    {  
      method: "POST",  
      headers: {  
        "Authorization": "Bearer YOUR\_API\_KEY",  
        "Content-Type": "application/json",  
      },  
      body: JSON.stringify(\[  
        { url: "https://www.linkedin.com/in/satyanadella" },  
        { url: "https://www.linkedin.com/in/jeffweiner08" },  
        { url: "https://www.linkedin.com/in/rbranson" },  
        { url: "https://www.linkedin.com/in/sherylsandberg" },  
        { url: "https://www.linkedin.com/in/raboram" },  
      \]),  
    }  
  );

  const snapshot \= await response.json();  
  console.log("Snapshot ID:", snapshot.snapshot\_id);  
  \`\`\`  
\</CodeGroup\>

You should see a \`200\` response with a \`snapshot\_id\`:

\`\`\`json theme={null}  
{  
  "snapshot\_id": "s\_m1a2b3c4d5e6f7g8h"  
}  
\`\`\`

Save this ID. You need it to check progress and download results.

\#\# Step 2: Monitor progress

Poll the snapshot status until it shows \`ready\`. This takes 30 seconds to several minutes depending on the number of URLs.

\<CodeGroup\>  
  \`\`\`bash cURL theme={null}  
  curl "https://api.brightdata.com/datasets/v3/progress/s\_m1a2b3c4d5e6f7g8h" \\  
    \-H "Authorization: Bearer YOUR\_API\_KEY"  
  \`\`\`

  \`\`\`python Python theme={null}  
  import time

  snapshot\_id \= "s\_m1a2b3c4d5e6f7g8h"

  while True:  
      status\_response \= requests.get(  
          f"https://api.brightdata.com/datasets/v3/progress/{snapshot\_id}",  
          headers={"Authorization": "Bearer YOUR\_API\_KEY"},  
      )  
      status \= status\_response.json().get("status")  
      print(f"Status: {status}")

      if status \== "ready":  
          break  
      time.sleep(10)  
  \`\`\`

  \`\`\`javascript Node.js theme={null}  
  const snapshotId \= "s\_m1a2b3c4d5e6f7g8h";

  let status \= "collecting";  
  while (status \!== "ready") {  
    const statusResponse \= await fetch(  
      \`https://api.brightdata.com/datasets/v3/progress/${snapshotId}\`,  
      { headers: { "Authorization": "Bearer YOUR\_API\_KEY" } }  
    );  
    const statusData \= await statusResponse.json();  
    status \= statusData.status;  
    console.log("Status:", status);

    if (status \!== "ready") {  
      await new Promise((r) \=\> setTimeout(r, 10000));  
    }  
  }  
  \`\`\`  
\</CodeGroup\>

Status values:

| Status       | Meaning                             |  
| :----------- | :---------------------------------- |  
| \`collecting\` | Scraping is in progress             |  
| \`digesting\`  | Data is being processed             |  
| \`ready\`      | Results are available for download  |  
| \`failed\`     | The collection encountered an error |

\#\# Step 3: Download results

Once the status is \`ready\`, download the scraped data:

\<CodeGroup\>  
  \`\`\`bash cURL theme={null}  
  curl "https://api.brightdata.com/datasets/v3/snapshot/s\_m1a2b3c4d5e6f7g8h?format=json" \\  
    \-H "Authorization: Bearer YOUR\_API\_KEY" \\  
    \-o results.json  
  \`\`\`

  \`\`\`python Python theme={null}  
  results\_response \= requests.get(  
      f"https://api.brightdata.com/datasets/v3/snapshot/{snapshot\_id}",  
      params={"format": "json"},  
      headers={"Authorization": "Bearer YOUR\_API\_KEY"},  
  )

  results \= results\_response.json()  
  print(f"Collected {len(results)} profiles")  
  \`\`\`

  \`\`\`javascript Node.js theme={null}  
  const resultsResponse \= await fetch(  
    \`https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json\`,  
    { headers: { "Authorization": "Bearer YOUR\_API\_KEY" } }  
  );

  const results \= await resultsResponse.json();  
  console.log(\`Collected ${results.length} profiles\`);  
  \`\`\`  
\</CodeGroup\>

You've successfully triggered, monitored, and downloaded a batch LinkedIn scraping job.

\#\# Skip polling with webhooks

If you don't want to poll for status, add a \`webhook\` parameter to receive results automatically:

\`\`\`bash theme={null}  
curl \-X POST \\  
  "https://api.brightdata.com/datasets/v3/trigger?dataset\_id=gd\_l1viktl72bvl7bjuj0\&format=json\&webhook=https://your-server.com/webhook" \\  
  \-H "Authorization: Bearer YOUR\_API\_KEY" \\  
  \-H "Content-Type: application/json" \\  
  \-d '\[{"url": "https://www.linkedin.com/in/satyanadella"}\]'  
\`\`\`

See \[How to receive LinkedIn data via webhooks\](/datasets/scrapers/linkedin/data-delivery/webhooks) for the full setup.

\#\# Limits and constraints

| Constraint                           | Value      |  
| :----------------------------------- | :--------- |  
| Max input file size                  | 1 GB       |  
| Max concurrent batch requests        | 100        |  
| Max concurrent single-input requests | 1,500      |  
| Webhook delivery size                | Up to 1 GB |  
| API download size                    | Up to 5 GB |

\#\# Troubleshooting

\<Accordion title="Getting a 429 Too Many Requests error?"\>  
  You've exceeded the concurrent request limit. Reduce the number of parallel requests or combine inputs into fewer, larger batches. Each batch can include up to 1 GB of input data.  
\</Accordion\>

\<Accordion title="Snapshot status shows 'failed'?"\>  
  Check that all input URLs are valid LinkedIn URLs. Review the error details in the snapshot response or in the \[Logs tab\](https://brightdata.com/cp/scrapers) of your Bright Data dashboard.  
\</Accordion\>

\<Accordion title="Results are incomplete or missing some URLs?"\>  
  Some URLs may fail individually while the overall job succeeds. Check the snapshot response for any \`errors\` field. Retry failed URLs in a separate request.  
\</Accordion\>

\#\# Next steps

\<CardGroup cols={2}\>  
  \<Card title="Set up webhooks" icon="webhook" href="/datasets/scrapers/linkedin/data-delivery/webhooks"\>  
    Receive results without polling.  
  \</Card\>

  \<Card title="Deliver to S3" icon="bucket" href="/datasets/scrapers/linkedin/data-delivery/amazon-s3"\>  
    Send results directly to your S3 bucket.  
  \</Card\>  
\</CardGroup\>

