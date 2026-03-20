import React from 'react';

interface AtsDashboardProps {
  score: number;
  missingKeywords: string[];
  commonKeywords: string[];
}

export default function AtsDashboard({ score, missingKeywords, commonKeywords }: AtsDashboardProps) {
  // Lógica para definir o status com base na nota
  let statusText = "REPROVADO";
  let statusColorClass = "bg-red-100 text-red-600";
  let textColorClass = "text-red-600";
  let riskText = "⚠ Risco de Rejeição: ALTO";
  let descriptionText = "O currículo não atende à maioria dos requisitos da vaga. É altamente recomendável revisar e adicionar as palavras-chave ausentes.";

  if (score >= 80) {
    statusText = "APROVADO";
    statusColorClass = "bg-green-100 text-green-600";
    textColorClass = "text-green-600";
    riskText = "✅ Excelentes Chances";
    descriptionText = "Seu currículo está muito bem alinhado com a vaga! Você possui a maioria das palavras-chave procuradas pelo ATS.";
  } else if (score >= 50) {
    statusText = "ATENÇÃO";
    statusColorClass = "bg-yellow-100 text-yellow-700";
    textColorClass = "text-yellow-600";
    riskText = "⚠ Pode precisar de ajustes";
    descriptionText = "Seu currículo tem boa aderência, mas faltam algumas palavras-chave importantes que podem aumentar suas chances.";
  }

  return (
    <div className="bg-gray-100 p-6 rounded-2xl mt-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* RESULTADO */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Resultado da Análise</h2>
            <span className={`${statusColorClass} px-3 py-1 rounded-full text-xs font-semibold`}>
              {statusText}
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-1">
            Baseado nos critérios de +50 ATS do mercado
          </p>

          <div className="flex gap-10 mt-6 items-center">
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-1">SCORE GERAL</p>
              <h1 className={`text-5xl font-bold ${textColorClass}`}>{score}</h1>
              <span className="text-gray-400">/100</span>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-semibold mb-1">CLASSIFICAÇÃO</p>
              <p className="font-semibold text-gray-800">
                {score >= 50 ? (score >= 80 ? "Alta aderência ao ATS" : "Aderência moderada ao ATS") : "Reprovado automaticamente pelo ATS"}
              </p>
              <p className={`text-sm mt-2 font-medium ${textColorClass}`}>
                {riskText}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-6 leading-relaxed">
            {descriptionText}
          </p>
        </div>

        {/* COMPOSIÇÃO (Visual ilustrativo adaptado) */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-semibold mb-4 text-gray-800">Métricas da Análise</h3>

          {[
            ["Match de Palavras", `${score}%`],
            ["Faltantes", missingKeywords.length.toString()],
            ["Encontradas", commonKeywords.length.toString()],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between mb-3 border-b border-gray-100 pb-2 last:border-0">
              <span className="text-sm text-gray-600">{label}</span>
              <span className="text-sm font-semibold text-gray-800">{value}</span>
            </div>
          ))}

          {missingKeywords.length > 0 && (
            <>
              <h4 className="mt-4 text-sm font-semibold text-red-500">
                AÇÕES IMEDIATAS
              </h4>
              <ul className="text-xs text-red-500 mt-2 space-y-1">
                <li>• Adicionar palavras-chave ausentes</li>
                <li>• Revisar os requisitos da vaga</li>
              </ul>
            </>
          )}
        </div>

        {/* PALAVRAS-CHAVE AUSENTES */}
        <div className="col-span-1 md:col-span-3 bg-white rounded-2xl shadow p-6">
          <h3 className="font-semibold text-gray-800">Palavras-chave Ausentes</h3>
          <p className="text-sm text-gray-500 mb-4">
            Termos importantes da vaga que não foram encontrados no seu CV
          </p>

          <div className="flex flex-wrap gap-2">
            {missingKeywords.length > 0 ? (
              missingKeywords.map(tag => (
                <span
                  key={tag}
                  className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-medium border border-red-200"
                >
                  {tag}
                </span>
              ))
            ) : (
              <p className="text-sm text-green-600 font-medium">Nenhuma palavra-chave importante ausente!</p>
            )}
          </div>
        </div>

        {/* PONTOS FORTES */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-semibold text-green-600 mb-2">
            Pontos Fortes (Encontrados)
          </h3>

          <ul className="text-sm text-gray-700 space-y-2">
            {commonKeywords.length > 0 ? (
              commonKeywords.map(tag => (
                <li key={tag} className="flex items-center gap-2">
                  <span>✅</span> <span className="capitalize">{tag}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-500 italic">Nenhum ponto forte extraído nesta análise.</li>
            )}
          </ul>
        </div>

        {/* DICAS */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-2xl shadow p-6">
          <h3 className="font-semibold text-blue-600 mb-2">
            Dicas de Otimização
          </h3>

          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Adaptar o CV especificamente para esta vaga.</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Incluir as palavras-chave ausentes de forma natural nas suas experiências.</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Quantificar seus resultados (ex: "aumentei as vendas em 20%").</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Garantir que o formato do PDF/Word esteja limpo e sem tabelas complexas.</li>
          </ul>
        </div>

        {/* CTA */}
        <div className="col-span-1 md:col-span-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6 text-center shadow-lg">
          <p className="text-lg font-semibold">
            {score < 70 ? "Com esse score, você pode estar perdendo oportunidades." : "Ótimo trabalho! Seu currículo está forte."}
          </p>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10 my-6">
            <div className="bg-white/10 px-4 py-2 rounded-lg">
              <p className="text-3xl font-bold">90+</p>
              <span className="text-sm text-blue-100">Score ideal</span>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-lg">
              <p className="text-3xl font-bold">3x</p>
              <span className="text-sm text-blue-100">Mais entrevistas</span>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-lg">
              <p className="text-3xl font-bold">2 min</p>
              <span className="text-sm text-blue-100">Tempo médio ATS</span>
            </div>
          </div>

          <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold shadow-md hover:bg-gray-50 transition-colors">
            Gerar currículo otimizado (Em Breve)
          </button>
        </div>

      </div>
    </div>
  );
}
