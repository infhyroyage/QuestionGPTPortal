import TopBar from "@/components/TopBar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/ui/use-toast";
import { fetchTestDetailsAtom } from "@/lib/atoms";
import { accessBackend } from "@/lib/backend";
import { basePath } from "@/lib/github";
import { GetQuestion, Subject } from "@/types/backend";
import { useAccount, useMsal } from "@azure/msal-react";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

/**
 * テストページのコンポーネント
 * @returns テストページのコンポーネント
 */
export default function TestQuestionPage() {
  const [testDetails] = useAtom(fetchTestDetailsAtom);
  const [question, setQuestion] = useState<GetQuestion | undefined>(undefined);

  const { testId, questionNumber } = useParams();

  const { instance, accounts } = useMsal();
  const accountInfo = useAccount(accounts[0] || {});

  const navigate = useNavigate();

  // tesiIdでの情報を習得していない場合はテスト準備ページにリダイレクト
  useEffect(() => {
    if (testId && !testDetails[testId]) {
      navigate(`${basePath}/tests/${testId}/ready`);
    }
  }, [navigate, testDetails, testId]);

  // 初回レンダリング時のみ[GET] /tests/{testId}/questions/{questionNumber}を実行
  useEffect(() => {
    (async () => {
      try {
        const res: GetQuestion = await accessBackend<GetQuestion>(
          "GET",
          `/tests/${testId}/questions/${questionNumber}`,
          instance,
          accountInfo
        );

        setQuestion(res);
      } catch (e) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "システムエラーが発生しました",
          description: (
            <>
              <p>以下をシステム管理者にご連絡ください</p>
              <p>{String(e)}</p>
            </>
          ),
        });
      }
    })();
  }, [accountInfo, instance, questionNumber, testId]);

  return (
    testId &&
    testDetails[testId] && (
      <>
        <TopBar
          title={`[${testDetails[testId].courseName}] ${testDetails[testId].testName}`}
        />
        <div className="pt-16 px-4">
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight my-6">
            {`${questionNumber}問目 (全${testDetails[testId].length}問)`}
          </h3>
          <div className="space-y-4 mb-4">
            {question ? (
              question.subjects.map((subject: Subject, idx: number) => (
                <p key={idx} className="leading-7">
                  {subject.sentence}
                </p>
              ))
            ) : (
              <Skeleton className="h-7 w-full" />
            )}
          </div>
          <div className="h-[40vh]" />
        </div>
        <div className="fixed bottom-0 h-[40vh] w-full px-4">
          <ScrollArea className="h-full rounded-md border bg-zinc-200 dark:bg-zinc-800">
            {/* TODO: Toggleを用いて選択肢を実装 */}
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi eius
            libero soluta suscipit porro commodi iure quibusdam quod, distinctio
            sit, et, placeat nostrum nobis doloremque rerum consectetur officia.
            Magnam, sit quos omnis quod amet optio odio numquam sint, vero
            libero ut laudantium aliquid deleniti commodi vel. Suscipit tenetur
            odit temporibus impedit. Cumque libero sint odio. Ratione odit
            assumenda eveniet at? Unde corrupti error aliquid labore eveniet
            laboriosam nemo, veritatis architecto est consectetur quo
            repellendus minima deleniti quisquam ad quidem accusantium animi
            libero fugiat et quos. Perferendis iure, aliquam sapiente officia
            voluptas, aliquid amet accusantium nihil numquam, consequatur
            voluptatum culpa! Odio, earum eum explicabo commodi doloribus hic
            cum est minus eius similique velit sunt repudiandae ad cumque
            aliquam perspiciatis dolorum, deserunt alias amet reiciendis quia
            blanditiis. Cum voluptates nesciunt, accusamus quidem adipisci
            quaerat quas sint quae consequatur magnam odit praesentium, expedita
            sed a voluptatem inventore odio aperiam vitae sequi totam eveniet
            repudiandae. Atque laudantium quis nobis, ut quos fuga, quo quidem
            recusandae in a eligendi nulla eum rerum consequatur ratione ullam.
            Ad omnis necessitatibus voluptas eveniet harum iusto adipisci quis a
            reiciendis vero quam possimus nostrum enim incidunt quia saepe
            soluta quibusdam quaerat, minima, praesentium maiores animi
            reprehenderit quidem alias. Harum dignissimos, quae cum veniam odit
            cumque necessitatibus, ipsum nihil, consectetur voluptatem quaerat
            adipisci velit! Earum quam aperiam dolore aliquam nesciunt eveniet
            consectetur vitae perferendis quas, quia veniam quisquam aliquid a
            error animi quo fugiat illo deleniti unde dignissimos exercitationem
            voluptates obcaecati maxime quibusdam. Corrupti, dolorum ipsam illo
            distinctio iure ipsum magni facere laudantium veniam itaque autem,
            ullam blanditiis quod laborum perferendis voluptatum recusandae
            beatae labore odit, explicabo sed perspiciatis fugiat! Ut eum porro
            cum a, rerum exercitationem itaque natus quidem cumque voluptate,
            quod aliquid dolorem soluta odit minus possimus praesentium
            distinctio ad iusto recusandae nesciunt perspiciatis! Quisquam, odit
            esse! Natus, dolorum at dolore, error saepe quaerat dolores est, nam
            blanditiis labore ex! Sequi consequatur ratione, odit repellat
            beatae nemo, veniam ipsa quis eligendi deleniti, impedit sit
            architecto dicta. Illo, sit veritatis nulla suscipit et temporibus.
            Ab id at natus. Fugit nobis dolore, ipsam consequatur blanditiis
            dolorum fugiat atque, nam illo eaque officia nostrum. Commodi
            perspiciatis cumque sint aut, earum dicta iste quia ex doloremque
            nisi enim dolores libero nihil tempora deserunt. Voluptas, ducimus
            iure quam vero nemo placeat, natus asperiores harum perferendis
            obcaecati laborum tempore dolore quos culpa, veritatis dolorum quod
            dignissimos consequatur suscipit. Nemo, non, aliquam aspernatur
            numquam iure corrupti sint quis in, accusamus qui repellat ullam
            fugiat veniam placeat omnis reiciendis id! Nobis consectetur vel
            distinctio sint totam tenetur quibusdam illo. Culpa consequuntur
            alias aspernatur excepturi itaque? Delectus ab hic qui, odit iste
            esse ex fugit commodi repellat tenetur. Cupiditate soluta
            reprehenderit voluptatibus quo nisi praesentium assumenda ipsam
            officiis blanditiis perferendis pariatur omnis, qui, maiores rem
            quis eos cumque hic molestiae? Temporibus praesentium qui
            exercitationem aut. Harum accusamus velit molestias numquam minus ab
            quibusdam fuga! Aspernatur hic ducimus sequi nostrum cumque atque,
            dolorum qui officia consectetur praesentium nihil similique
            repellendus officiis mollitia optio odio dicta doloribus
            reprehenderit eaque dolor? Officia minus expedita explicabo. Quaerat
            repellat fugit accusamus ipsum voluptatibus culpa mollitia
            consequuntur. Quia id laborum dicta ipsa, nihil neque maiores quas
            enim quam impedit, iure debitis aliquam facilis cumque saepe
            doloribus dolorum, quod rem dolores. Molestiae minima voluptatibus
            tenetur temporibus nemo cum tempora rerum consequuntur veniam sit
            nostrum officia eaque, debitis, vel alias enim! Mollitia
            reprehenderit dolorum quasi! Sunt et repudiandae accusamus
            architecto doloribus aut, eveniet reiciendis, ab odio excepturi non
            nam magni ea voluptatibus laboriosam! Modi itaque nobis veritatis
            quas repudiandae amet placeat inventore quibusdam, enim aperiam
            pariatur error similique labore explicabo laboriosam soluta mollitia
            tempora cum voluptatibus! Iure porro, id, doloremque aut, quae
            deleniti est asperiores delectus maxime facilis nobis ad dignissimos
            suscipit. Magni autem aliquam deserunt natus ipsum iure ad
            architecto officia odit magnam! Quibusdam aliquam delectus ducimus
            labore alias facere totam consequuntur veritatis ipsa incidunt?
            Voluptates accusantium neque sunt consequatur dolores blanditiis
            vero explicabo nostrum quaerat at ab aliquid asperiores nemo,
            distinctio autem praesentium modi voluptas eaque corporis illo
            pariatur! Voluptate, dolorem? Natus eos quidem nemo sit repellat?
            Omnis fugit ullam vero quod saepe. Vero nesciunt eos neque, dolores,
            distinctio hic aliquid totam consequatur rem saepe dolor dolore,
            atque cupiditate autem perspiciatis nisi recusandae qui temporibus
            cumque voluptatum tenetur expedita dicta nostrum. Illum aliquid
            impedit sit omnis commodi molestiae fugit doloribus sunt deserunt.
            Nemo fugiat nobis ipsum natus, assumenda sequi praesentium similique
            cupiditate maxime neque consequatur dolor eius eos optio
            perspiciatis tenetur a molestias voluptatibus rerum ab.
            Exercitationem aliquid minima totam fuga architecto soluta animi.
            Nihil, ad. Facilis officia nesciunt eveniet qui praesentium eligendi
            aliquam, natus dolor saepe? Tenetur quibusdam assumenda itaque,
            mollitia commodi quis! Eos, consectetur officia dignissimos sequi
            excepturi in fugiat dicta natus neque laboriosam libero corrupti
            asperiores quo dolorum amet iste tempore, esse, quidem quibusdam
            pariatur dolorem debitis architecto? Eius error laborum vel, sint
            facere eaque odio possimus ipsum, tenetur iure ad expedita id sed
            reprehenderit amet dolor ducimus in aperiam, maiores odit explicabo
            aut? Nam ipsam quos ex ullam consectetur quae eos magnam! In
            doloremque dolore sunt eaque mollitia iusto! Nam quibusdam quae
            suscipit at ad voluptas molestiae autem sequi illo repellat
            recusandae numquam non sed veniam, omnis aut itaque debitis, iste
            nobis est dolorum ullam repudiandae porro deserunt. Eos libero eius
            quos, eaque dolorum reiciendis reprehenderit. Velit harum maxime,
            recusandae delectus fugit deserunt voluptate dignissimos nam
            pariatur minus iusto illo molestias, dolore rerum cumque corrupti
            nobis consequatur voluptas voluptatibus dolorem suscipit distinctio
            cum maiores! Mollitia odio molestiae numquam pariatur optio esse
            voluptatum expedita, culpa fugit cumque dolorem iste, eligendi enim
            hic ad distinctio. In nam voluptatibus, reiciendis quas quibusdam at
            rerum illum iste tenetur dolorum maxime rem ducimus consequatur!
            Esse itaque quibusdam harum accusantium animi sit consectetur at!
            Optio animi velit assumenda eveniet et molestias quibusdam omnis
            exercitationem. Nisi, illo rerum itaque saepe excepturi ducimus,
            suscipit eaque minus obcaecati illum consequuntur! Ea laudantium
            eaque reiciendis amet magni autem tempora consectetur. Nemo illo,
            esse aut error voluptatem veniam vel debitis similique ullam,
            perferendis exercitationem recusandae quis dignissimos mollitia
            ratione. Facilis?
          </ScrollArea>
        </div>
      </>
    )
  );
}
