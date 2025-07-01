var isenFullPKCrypto = "";

var moipIdp = 1;
var moipIds = 1;

var isenRespIdp = "";
var isenRespIds = "";

var dataInicial = "";
var dataFinal = "";
var isOdonto = "";
var isSoOdonto = "";

var parametrosGraficos = {};

let varValidaApiHospidata = "";

function buscaDadosPaciente() {
  if (
    validaNull(isenFullPKCrypto) == null &&
    validaNull(moipIdp) == null &&
    validaNull(moipIds) == null &&
    validaNull(justificativa) == null &&
    validaNull(responsavelNome) == null &&
    validaNull(responsavelCPF) == null &&
    validaNull(dataInicial) == null &&
    validaNull(dataFinal) == null
  ) {
    errorDialog(
      "Erro ao carregar dados do prontuário! Por favor, feche a janela/aba e tente acessar novamente o prontuário."
    );
  } else {
    const parametros = {
      isenFullPKCrypto: validaNull(isenFullPKCrypto),
      "motivoPK.idp": validaNull(moipIdp),
      "motivoPK.ids": validaNull(moipIds),
      justificativa: validaNull(justificativa),
      responsavelNome: validaNull(responsavelNome),
      responsavelCPF: validaNull(responsavelCPF),
      dataInicial: validaNull(dataInicial),
      dataFinal: validaNull(dataFinal),
    };

    return get("prontuarioAmbulatorial2/buscaDadosPacienteHTML", parametros)
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        const data = json[0] || json;
        successBuscaDadosPaciente(data);
      })
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      });
  }
}

function successBuscaDadosPaciente(json) {
  $("[id='isen_cod']").html(
    "<b>" + json.isen_cod + " " + json.enti_nome_paciente + "</b>"
  );

  if (json.sexo == "m" || json.sexo == "M") {
    $("[id='isen_sexo']").html("<b>MASCULINO</b>");
  } else {
    $("[id='isen_sexo']").html("<b>FEMININO</b>");
  }

  $("[id='isen_estado_civil']").html("<b>" + json.estc_nome + "</b>");
  $("[id='isen_filiacao']").html("<b>" + json.enti_nome_mae + "</b>");
  $("[id='isen_profissao']").html("<b>" + json.dcbo_nome + "</b>");
  $("[id='isen_idade']").html(
    "<b>" + json.data_nasc + " - " + json.idade + "</b>"
  );
  $("[id='isen_num_cad_sus']").html("<b>" + json.isen_num_cad_sus + "</b>");
  $("[id='isen_cpf']").html("<b>" + json.isen_cpf + "</b>");
  $("[id='isen_rg']").html("<b>" + json.isen_rg + "</b>");
  $("[id='isen_rg_comp']").html("<b>" + json.isen_rg_comp + "</b>");
  $("[id='isen_endereco']").html(
    "<b>" +
      json.endereco +
      ", " +
      json.loca_nome +
      " / " +
      json.cida_nome +
      " - " +
      json.esta_uf +
      "</b>"
  );
  $("[id='isen_fone']").html(
    "<b>(" + json.enti_tel_1_pre + ") " + json.enti_tel_1 + "</b>"
  );
  $("[id='isen_obs']").html("<b>" + json.enti_obs + "</b>");
  $("[id='alergias']").html("<b>" + json.alergias + "</b>");
  $("[id='intervaloDatas']").html(
    "<b> De: " + json.data_inicial + " At&eacute;: " + json.data_final + "</b>"
  );
  $("[id='isen_foto']").attr("src", json.isen_foto).attr("title", "Foto");
  $("[id='cida_nasc']").html("<b>" + json.cida_nasc + "</b>");
  $("[id='unid_ref']").html("<b>" + json.unid_ref + "</b>");
  $("[id='area_micr']").html("<b>" + json.area_micr + "</b>");
  $("[id='isen_raca_cor']").html("<b>" + json.isen_raca_cor + "</b>");
  $("[id='isen_sifa_nome']").html("<b>" + json.isen_sifa_nome + "</b>");
  if (json.historicoIvcf && json.historicoIvcf.trim() !== "") {
    $("[id='fieldsetHistoricoIvcf']").removeClass("sigss-oculta");
    $("[id='historicoIvcf']").html("<b>" + json.historicoIvcf + "</b>");
  } else {
    $("[id='fieldsetHistoricoIvcf']").addClass("sigss-oculta");
  }

  if (
    json.data_ultima_est_odont !== undefined &&
    json.data_ultima_est_odont !== null
  ) {
    $("[id='lbRiscoOdontologico']").html(
      "<div style='margin-top: 5px'><span style='margin-right: 5px'>" +
        json.data_ultima_est_odont +
        "</span><span id='spanBarraEstOdont' style='margin-right: 5px'></span><span>" +
        json.status_ultima_est_odont +
        "</span></div>"
    );
    $("[id='spanBarraEstOdont']").addClass(json.cor_ultima_est_odont);
  }

  const entf_idp = json.entf_idp;
  const entf_ids = json.entf_ids;
  if (entf_idp && entf_ids) {
    loadPhoto(entf_idp, entf_ids);
  }

  $("[id='impressao']").html(
    "<label>Impresso Por: " +
      json.usuario_sistema +
      " - " +
      json.impresso_date +
      " - " +
      json.impresso_time +
      "&nbsp;</label>"
  );

  convertHtmlToPdf();
}

function loadPhoto(entfPK_idp, entfPK_ids) {
  const params = {
    "entfPK.idp": entfPK_idp,
    "entfPK.ids": entfPK_ids,
  };

  return get("entidadeFisica/getHashFoto", params).then((photoPath) => {
    $("#isen_foto").attr("src", photoPath);
  });
}

function setParametesForAssDigital() {
  var par = $("body").serializeJSON();

  return [
    $("body"), // element para converter em pdf            //*0
    277, // height do doc padrão 282                 //*1
    1500, // taxa de redução                          //*2
    ["button"], // id dos elementos para esconder da tela   //*3
    "", // usuario assinatura do doc                //*4
    "", // cpf assinatura doc                       //*5
    "", // isenIdp,                                 //*6
    "", // isenIds                                  //*7
    "", // agcoIdp,                                 //*8
    "", // agcoIds,                                 //*9
    "prontuario", // DescricaoPDF                             //*10
    "prontuarioAmbulatorio", // reportName                               //*11
    par.isenFullPKCrypto, // fullPK criptografada                     //*12
  ];
}

function buscaDadosPPDC(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get("prontuarioAmbulatorial2/buscaDadosPPDC_HTML", parametros)
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosPPDC']").html(json.tabela);
        }
      });
  }
}

function buscaDadosPPDC_Esquema(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get(
      "prontuarioAmbulatorial2/buscaDadosPPDC_Esquema_HTML",
      parametros
    )
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosPPDC_Esquema']").html(json.tabela);
        }
      });
  }
}

function buscaDadosConsulta(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get("prontuarioAmbulatorial2/buscaDadosConsulta_HTML", parametros)
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosConsultas']").html(json.tabela);
        }
      });
  }
}

function buscaDadosObservacaoEnfermagem(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get(
      "prontuarioAmbulatorial2/dadosObservacaoEnfermagem_HTML",
      parametros
    )
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosObservacaoEnfermagem']").html(json.tabela);
        }
      });
  }
}

function buscaDadosEncaminhamento(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get(
      "prontuarioAmbulatorial2/buscaDadosEncaminhamento_HTML",
      parametros
    )
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosEncaminhamentos']").html(json.tabela);
        }
      });
  }
}

function buscaDadosConsultaEspecializadas(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get(
      "prontuarioAmbulatorial2/buscaDadosConsultaEspecializadas_HTML",
      parametros
    )
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosConsultasEspecializadas']").html(json.tabela);
        }
      });
  }
}

function buscaDadosConsultasOdontologicas(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get(
      "prontuarioAmbulatorial2/buscaDadosConsultasOdontologicas_HTML",
      parametros
    )
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosConsultasOdontologicas']").html(json.tabela);
        }
      });
  }
}

function buscaDadosExamesSolicitados(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get(
      "prontuarioAmbulatorial2/buscaDadosExamesSolicitados_HTML",
      parametros
    )
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosExamesSolicitados']").html(json.tabela);
        }
      });
  }
}

function buscaDadosExamesSolicitadosAvaliados(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get(
      "prontuarioAmbulatorial2/buscaDadosExamesSolicAval_HTML",
      parametros
    )
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosExamesSolicitadosAvaliados']").html(json.tabela);
        }
      });
  }
}

function buscaDadosExames(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get("prontuarioAmbulatorial2/buscaDadosExames_HTML", parametros)
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosExames']").html(json.tabela);
        }
      });
  }
}

function buscaDadosTriagem(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get("prontuarioAmbulatorial2/buscaDadosTriagem_HTML", parametros)
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosTriagem']").html(json.tabela);
        }
      });
  }
}

function buscaDadosProcedimentos(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get(
      "prontuarioAmbulatorial2/buscaDadosProcedimentos_HTML",
      parametros
    )
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosProcedimentos']").html(json.tabela);
        }
      });
  }
}

function buscaDadosVacinas(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get("prontuarioAmbulatorial2/buscaDadosVacinas_HTML", parametros)
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosVacinas']").html(json.tabela);
        }
      });
  }
}

function buscaDadosProcedimentosOdonto(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get(
      "prontuarioAmbulatorial2/buscaDadosProcedimentosOdonto_HTML",
      parametros
    )
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosProcedimentosOdonto']").html(json.tabela);
        }
      });
  }
}

function buscaDadosAIH(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get("prontuarioAmbulatorial2/buscaDadosAIH_HTML", parametros)
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosAIH']").html(json.tabela);
        }
      });
  }
}

function buscaDadosACS(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get("prontuarioAmbulatorial2/buscaDadosACS_HTML", parametros)
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosACS']").html(json.tabela);
        }
      });
  }
}

function buscaDadosListaEspera(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get("prontuarioAmbulatorial2/buscaDadosListaEspera_HTML", parametros)
      .then((json) => {
        if (json.tabela) {
          json = decodeHtmlEntitiesInJson(json);
          $("[id='htmlDadosListaEspera']").html(json.tabela);
        }
      })
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      });
  }
}

function buscaDadosInternamento(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get(
      "prontuarioAmbulatorial2/buscaDadosInternamento_HTML",
      parametros
    )
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosInternamento']").html(json.tabela);
        }
      });
  }
}

function buscaDadosAPAC(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get("prontuarioAmbulatorial2/buscaDadosAPAC_HTML", parametros)
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosAPAC']").html(json.tabela);
        }
      });
  }
}

function buscaDadosRAAS(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get("prontuarioAmbulatorial2/buscaDadosRAAS_HTML", parametros)
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosRAAS']").html(json.tabela);
        }
      });
  }
}

function buscaDadosReceituario(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get("prontuarioAmbulatorial2/buscaDadosReceituario_HTML", parametros)
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosReceituario']").html(json.tabela);
        }
      });
  }
}

function buscaDadosDemaisOrientacoes(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get(
      "prontuarioAmbulatorial2/buscaDadosDemaisOrientacaoes_HTML",
      parametros
    )
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosDemaisOrientacoes']").html(json.tabela);
        }
      });
  }
}

function buscaDadosSaidaFarmacia(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get(
      "prontuarioAmbulatorial2/buscaDadosSaidaFarmacia_HTML",
      parametros
    )
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosSaidaFarmacias']").html(json.tabela);
        }
      });
  }
}

function buscaDadosIteracao(mostrar) {
  if (isenFullPKCrypto && dataInicial && dataFinal && mostrar === "t") {
    const parametros = {
      isenFullPKCrypto: validaNull(isenFullPKCrypto),
      dataInicial: validaNull(dataInicial),
      dataFinal: validaNull(dataFinal),
    };

    return get(
      "prontuarioAmbulatorial2/buscaDadosInteracaoUsuario_HTML",
      parametros
    )
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosInteracoes']").html(json.tabela);
        }
      });
  }
}

function buscaDadosProcedimentosColetivos(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get(
      "prontuarioAmbulatorial2/buscaDadosProcedimentosColetivos_HTML",
      parametros
    )
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlProcedimentosColetivos']").html(json.tabela);
        }
      });
  }
}

function buscaReceituarioOftalmologico(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get(
      "prontuarioAmbulatorial2/buscaReceituarioOftalmologico",
      parametros
    )
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlReceituarioOftalmologico']").html(json.tabela);
        }
      });
  }
}

function buscaDadosConsultaOdonto(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get("prontuarioAmbulatorial/buscaDadosOdonto", parametros)
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlOdontoSoap']").html(json.tabela);
        }
      });
  }
}

$(document).ready(function () {
  $("#background").remove();

  promisesBuscaDados();

  setTabIndex({
    container: "tabFiltros",
    lastIndexTo: "[name='clearButton']",
  });
  $(".btn-imprimir").button({
    icons: {
      primary: "ui-icon ui-icon-print",
    },
  });
});

function gerarDadosCMCEHTML(list) {
  var data;
  var isData = false;
  list.forEach((el) => {
    const $tr = document.createElement("tr");
    isData = data === el["dataSolicitacao"];
    for (const o in el) {
      data = el["dataSolicitacao"];
      const $td = document.createElement("td");

      if (isData && o === "dataSolicitacao") {
        $td.appendChild(document.createTextNode(formatData(null)));
      } else {
        $td.appendChild(document.createTextNode(formatData(el[o])));
      }
      $tr.appendChild($td);
    }
    $("#tbody-cmce").append($tr);
  });
}

async function promisesBuscaDados() {
  isenFullPKCrypto = $("[id='isenFullPKCrypto']").val();
  moipIdp = $("[id='moip_idp']").val();
  moipIds = $("[id='moip_ids']").val();
  justificativa = $("[id='justificativa']").val();
  responsavelNome = $("[id='responsavelNome']").val();
  responsavelCPF = $("[id='responsavelCPF']").val();
  dataInicial = $("[id='dataInicial']").val();
  dataFinal = $("[id='dataFinal']").val();
  isOdonto = $("[id='isOdonto']").val();
  isSoOdonto = $("[id='isSoOdonto']").val();

  const $ppdc = $("[id='ppdc']");
  const $encaminhamento = $("[id='encaminhamento']");
  const $procedimento = $("[id='procedimento']");

  varValidaApiHospidata = await validaApiHospidata();

  if (isOdonto == "t" && isSoOdonto == "f") {
    return Promise.all([
      buscaDadosPaciente(),
      buscaDadosPPDC($ppdc.val()),
      buscaDadosPPDC_Esquema($ppdc.val()),
      buscaDadosConsultaOdonto(isOdonto),
      buscaDadosConsulta($("[id='consulta_basica']").val()),
      buscaDadosObservacaoEnfermagem($("[id='obs_enfermagem']").val()),
      buscaDadosEncaminhamento($encaminhamento.val()),
      buscaDadosEncaminhamentoHSP($encaminhamento.val()),
      buscaDadosConsultaEspecializadas(
        $("[id='consulta_especializada']").val()
      ),
      buscaDadosConsultasOdontologicas($("[id='consulta_odonto']").val()),
      buscaDadosExamesSolicitados($("[id='exame_solicitado']").val()),
      buscaDadosExamesSolicitadosAvaliados(
        $("[id='exame_solicitado_avaliado']").val()
      ),
      buscaDadosExames($("[id='exame']").val()),
      buscaDadosTriagem($("[id='triagem']").val()),
      buscaDadosProcedimentos($procedimento.val()),
      buscaDadosProcedimentosPA($procedimento.val()),
      buscaDadosVacinas($("[id='vacina']").val()),
      buscaDadosProcedimentosOdonto($("[id='procedimento_odonto']").val()),
      buscaDadosReceituario($("[id='medicamento_receitado']").val()),
      buscaDadosDemaisOrientacoes($("[id='demais_orientacoes']").val()),
      buscaDadosSaidaFarmacia($("[id='medicamento_retirado']").val()),
      buscaDadosAIH($("[id='aih']").val()),
      buscaDadosACS($("[id='acs']").val()),
      buscaDadosListaEspera($("[id='lista_espera']").val()),
      buscaDadosInternamento($("[id='internacao']").val()),
      buscaDadosAPAC($("[id='apac']").val()),
      buscaDadosRAAS($("[id='raas']").val()),
      buscaDadosIteracao("t"),
      buscaDadosProcedimentosColetivos($("[id='procedimento_coletivo']").val()),
      buscaReceituarioOftalmologico("t"),
      buscarDadosCMCE(),
      buscaDadosApi(),
      buscaConsultasExternasIds(),
      buscaExamesExternosIds(),
      buscaDadosApiLeitos(),
      buscaApiHospidataAgendamentos(),
      buscaApiHospidataExames(),
      buscaApiHospidataEvolucoes(),
      buscaApiHospidataPrescricoes(),
      buscaApiHospidataSinaisVitais(),
      buscaApiHospidataNotaInternacao(),
      buscaApiHospidataNotaAlta(),
      buscaApiIdsExterno(),
      buscaDadosIntegracaoAPAC($("[id='apac']").val()),
      buscaDadosRegulacao(),
    ]);
  } else if (isOdonto == "t" && isSoOdonto == "t") {
    return Promise.all([
      buscaDadosPaciente(),
      buscaDadosPPDC($ppdc.val()),
      buscaDadosPPDC_Esquema($ppdc.val()),
      buscaDadosConsultaOdonto(isOdonto),
      buscaDadosProcedimentosOdonto($("[id='procedimento_odonto']").val()),
      buscaDadosReceituario($("[id='medicamento_receitado']").val()),
      buscaDadosDemaisOrientacoes($("[id='demais_orientacoes']").val()),
      buscaDadosSaidaFarmacia($("[id='medicamento_retirado']").val()),
      buscaDadosConsultasOdontologicas($("[id='consulta_odonto']").val()),
      buscaDadosAIH($("[id='aih']").val()),
      buscaDadosACS($("[id='acs']").val()),
      buscaDadosListaEspera($("[id='lista_espera']").val()),
      buscaDadosInternamento($("[id='internacao']").val()),
      buscaDadosAPAC($("[id='apac']").val()),
      buscaDadosRAAS($("[id='raas']").val()),
      buscaDadosIteracao("t"),
      buscaDadosProcedimentosColetivos($("[id='procedimento_coletivo']").val()),
      buscaDadosApi(),
      buscaConsultasExternasIds(),
      buscaExamesExternosIds(),
      buscaApiIdsExterno(),
      buscaDadosIntegracaoAPAC($("[id='apac']").val()),
      buscaDadosRegulacao(),
    ]);
  }
}

function buscarDadosCMCE() {
  const data = { isenFullPKCrypto: isenFullPKCrypto };

  if (CONFIG.isUtlIntegracaoApac && CONFIG.isUtlIntegracaoAih) {
    return get("prontuarioAmbulatorial2/buscaDadosCMCE", data).then((json) => {
      json = decodeHtmlEntitiesInJson(json);
      if (!json.list.isEmpty()) {
        $("#div-cmce").removeClass("sigss-oculta");
        gerarDadosCMCEHTML(json.list);
      }
    });
  } else {
    $("#div-cmce").addClass("sigss-oculta");
  }
}

function buscaDadosApi() {
  const data = { isenFullPKCrypto: isenFullPKCrypto };
  if (CONFIG.isUtlIntegracaoApac && CONFIG.isUtlIntegracaoAih) {
    return get("prontuarioAmbulatorial2/buscaDadosApi", data).then((json) => {
      json = decodeHtmlEntitiesInJson(json);
      if (!json.list.isEmpty()) {
        $("#div-apac-aih").removeClass("sigss-oculta");
        gerarDadosHTML(json.list);
      }
    });
  } else {
    $("#div-apac-aih").addClass("sigss-oculta");
  }
}

function gerarDadosHTML(list) {
  list.forEach((el) => {
    const $tr = document.createElement("tr");
    for (const o in el) {
      const $td = document.createElement("td");
      $td.appendChild(document.createTextNode(formatData(el[o])));
      $tr.appendChild($td);
    }
    $("#tbody-apac-aih").append($tr);
  });
}

function formatData(data) {
  if (!data) {
    return "";
  }

  if (!data.time) {
    return data;
  }

  return new Date(
    data.date.split("-")[0],
    data.date.split("-")[1],
    data.date.split("-")[2],
    data.time.hour,
    data.time.minute,
    data.time.second
  ).toLocaleString("pt-BR");
}

function buscaDadosProcedimentosPA(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get(
      "prontuarioAmbulatorial2/buscaDadosProcedimentosPA_HTML",
      parametros
    )
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosProcedimentosPA']").html(json.tabela);
        }
      });
  }
}

function buscaDadosEncaminhamentoHSP(mostrar) {
  if (mostrar == "t") {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get(
      "prontuarioAmbulatorial2/buscaDadosEncaminhamentoHSP_HTML",
      parametros
    )
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      })
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.tabela) {
          $("[id='htmlDadosEncaminhamentosHsp']").html(json.tabela);
        }
      });
  }
}

function validaNull(variavel) {
  if (variavel == "null") {
    return null;
  } else {
    return variavel;
  }
}

function buscaConsultasExternasIds() {
  if (CONFIG.addInfoIdsProntuario) {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get("agendamentoIds/buscarConsultas", parametros)
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json) {
          let tabela =
            "<div class='verdeBranco'>AGENDAMENTO EXTERNO - CONSULTAS</div>";
          tabela += `<div>`;
          tabela += `<table class="full-width">`;

          tabela += `<tr class='tituloTabela'>`;
          tabela += `<th>DATA</th>`;
          tabela += `<th class="quarter-width">UNIDADE DE ATENDIMENTO</th>`;
          tabela += `<th class="quarter-width">CBO (ESPECIALIDADE)</th>`;
          tabela += `<th class="twentieth-width">SITUA&Ccedil;&Atilde;O</th>`;
          tabela += `<th class="fifth-width">PROFISSIONAL</th>`;
          tabela += `<th class="max-third-width">OBSERVA&Ccedil;&Atilde;O</th>`;
          tabela += `</tr>`;
          tabela += `<tbody>`;
          json.forEach((schedule) => {
            tabela += `<tr class='${
              schedule.schedulingStatus === "SCHEDULED"
                ? "textoVerde"
                : "textoVermelho"
            }'>`;
            tabela += `<td valign='top'>${moment(schedule.scheduleDate).format(
              "DD/MM/yyyy"
            )}</td>`;
            tabela += `<td valign='top'>${schedule.healthUnit}</td>`;
            tabela += `<td valign='top'>${schedule.professionalActivity} (${
              schedule.initials || ""
            })</td>`;
            tabela += `<td valign='top'>${situacao(
              schedule.schedulingStatus
            )}</td>`;
            tabela += `<td valign='top'>${schedule.professional}</td>`;
            tabela += `<td valign='top'>AGENDADO PARA IDS</td>`;
            tabela += `</tr>`;
          });
          tabela += `</tbody>`;
          tabela += `</table>`;
          tabela += `</div>`;
          tabela += `<br />`;
          $("[id='htmlAgendamentoConsultasExternasIds']").html(tabela);
        }
      })
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      });
  }
}

function buscaExamesExternosIds() {
  if (CONFIG.addInfoIdsProntuario) {
    const parametros = {
      isenFullPKCrypto: isenFullPKCrypto,
      dataInicial: dataInicial,
      dataFinal: dataFinal,
    };

    return get("agendamentoIds/buscarExames", parametros)
      .then((json) => {
        if (json) {
          json = decodeHtmlEntitiesInJson(json);
          let tabela =
            "<div class='verdeBranco'>AGENDAMENTO EXTERNO - EXAMES</div>";
          tabela += `<div>`;
          tabela += `<table class="full-width">`;

          tabela += `<tr class='tituloTabela'>`;
          tabela += `<th>DATA</th>`;
          tabela += `<th class="quarter-width">UNIDADE DE ATENDIMENTO</th>`;
          tabela += `<th class="quarter-width">EXAME / PROCEDIMENTO</th>`;
          tabela += `<th class="twentieth-width">SITUA&Ccedil;&Atilde;O</th>`;
          tabela += `<th class="max-third-width">OBSERVA&Ccedil;&Atilde;O</th>`;
          tabela += `</tr>`;
          tabela += `<tbody>`;
          json.forEach((schedule) => {
            tabela += `<tr class='${
              schedule.schedulingStatus === "SCHEDULED"
                ? "textoVerde"
                : "textoVermelho"
            }'>`;
            tabela += `<td valign='top'>${moment(schedule.scheduleDate).format(
              "DD/MM/yyyy"
            )}</td>`;
            tabela += `<td valign='top'>${schedule.healthUnit}</td>`;
            tabela += `<td valign='top'>${schedule.procedureName}</td>`;
            tabela += `<td valign='top'>${situacao(
              schedule.schedulingStatus
            )}</td>`;
            tabela += `<td valign='top'>AGENDADO PARA IDS</td>`;
            tabela += `</tr>`;
          });
          tabela += `</tbody>`;
          tabela += `</table>`;
          tabela += `</div>`;
          tabela += `<br />`;
          $("[id='htmlAgendamentoExamesExternosIds']").html(tabela);
        }
      })
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      });
  }
}

function situacao(status) {
  switch (status) {
    case "SCHEDULED":
      return "AGENDADO";
    case "CANCELED":
      return "CANCELADO";
    case "REPLACED":
      return "SUBSTITUÍDA";
    case "DELETED":
      return "DELETADO";
    case "ADJUSTMENT_PENDING":
      return "AJUSTE PENDENTE";
    default:
      return status;
  }
}

function buscaDadosApiLeitos() {
  if (CONFIG.addInfoLeitosProntuario) {
    const data = { isenFullPKCrypto: isenFullPKCrypto };
    return get("prontuarioAmbulatorial2/buscaDadosApiLeitos", data)
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json) {
          $("#htmlApiLeitos").removeClass("sigss-oculta");
          let tabela = "<div class='verdeBranco'>LEITOS</div>";
          tabela += `<div>`;
          tabela += `<table class="full-width">`;

          tabela += `<tr class='tituloTabela'>`;
          tabela += `<th>DATA SOLICITA&Ccedil;&Atilde;O</th>`;
          tabela += `<th>N°</th>`;
          tabela += `<th class="fifth-width">UNIDADE SOLICITANTE</th>`;
          tabela += `<th class="fifth-width">PROFISSIONAL SOLICITANTE</th>`;
          tabela += `<th class="tenth-width">STATUS</th>`;
          tabela += `<th class="fifth-width">CID</th>`;
          tabela += `<th class="fifth-width">PROCEDIMENTO</th>`;
          tabela += `<th class="fifth-width">UNIDADE EXECUTANTE</th>`;
          tabela += `</tr>`;
          tabela += `<tbody>`;
          json.forEach((leito) => {
            tabela += `<tr>`;
            tabela += `<td valign='top'>${moment(
              leito.dataHoraSolicitacao
            ).format("DD/MM/yyyy")}</td>`;
            tabela += `<td valign='top'>${leito.numeroSolicitacao || ""}</td>`;
            tabela += `<td valign='top'>${leito.unidadeSolicitante || ""}</td>`;
            tabela += `<td valign='top'>${
              leito.profissionalSolicitante || ""
            }</td>`;
            tabela += `<td valign='top'>${leito.situacaoSatus || ""}</td>`;
            tabela += `<td valign='top'>${leito.cidPrincipal || ""}</td>`;
            tabela += `<td valign='top'>${
              leito.procedimentoPrincipal || ""
            }</td>`;
            tabela += `<td valign='top'>${leito.unidadeExecutante || ""}</td>`;
            tabela += `</tr>`;
          });
          tabela += `</tbody>`;
          tabela += `</table>`;
          tabela += `</div>`;
          tabela += `<br />`;
          $("[id='htmlApiLeitos']").html(tabela);
        }
      })
      .fail((xhr) => {
        showMessageDialog({
          msg: xhr.responseText,
          buttons: "ok",
          tipo: "error",
        });
      });
  } else {
    $("#htmlApiLeitos").addClass("sigss-oculta");
  }
}

//BUSCA API HOSPIDATA - AGENDAMENTOS
function buscaApiHospidataAgendamentos() {
  if (CONFIG.prontuarioIsBuscaHosp && varValidaApiHospidata === "t") {
    const data = { isenFullPKCrypto: isenFullPKCrypto };
    return get("prontuarioAmbulatorial2/buscaApiHospidataAgendamentos", data)
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json && json.length > 0) {
          $("#htmlApiHospidataAgendamento").removeClass("sigss-oculta");
          let tabela =
            "<div class='verdeBranco'>HOSPITALAR - AGENDAMENTOS</div>";
          tabela += `<div>`;
          tabela += `<table class="full-width">`;

          tabela += `<tr class='tituloTabela'>`;
          tabela += `<th class="fifth-width">DATA</th>`;
          tabela += `<th class="fifth-width">HORA</th>`;
          tabela += `<th class="tenth-width">MEDICO</th>`;
          tabela += `<th class="fifth-width">UNIDADE</th>`;
          tabela += `<th class="fifth-width">ESPECIALIDADE</th>`;
          tabela += `<th class="fifth-width">CONVENIO</th>`;
          tabela += `</tr>`;
          tabela += `<tbody>`;
          json.forEach((api) => {
            const str =
              api.HoraConsulta == null || api.HoraConsulta == "undefined"
                ? ""
                : api.HoraConsulta.substring(0, 5);

            tabela += `<tr>`;
            tabela += `<td valign='top'>${moment(api.DataConsulta).format(
              "DD/MM/yyyy"
            )}</td>`;
            tabela += `<td valign='top'>${str || ""}</td>`;
            tabela += `<td valign='top'>${api.Medico || ""}</td>`;
            tabela += `<td valign='top'>${api.NomeHospital || ""}</td>`;
            tabela += `<td valign='top'>${api.Especialidade || ""}</td>`;
            tabela += `<td valign='top'>${api.Convenio || ""}</td>`;
            tabela += `</tr>`;
          });
          tabela += `</tbody>`;
          tabela += `</table>`;
          tabela += `</div>`;
          tabela += `<br />`;
          $("[id='htmlApiHospidataAgendamento']").html(tabela);
        }
      })
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      });
  } else {
    $("#htmlApiHospidataAgendamento").addClass("sigss-oculta");
  }
}

//BUSCA API HOSPIDATA - EXAMES
function buscaApiHospidataExames() {
  if (CONFIG.prontuarioIsBuscaHosp && varValidaApiHospidata === "t") {
    const data = { isenFullPKCrypto: isenFullPKCrypto };
    return get("prontuarioAmbulatorial2/buscaApiHospidataExames", data)
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json && json.length > 0) {
          $("#htmlApiHospidataExames").removeClass("sigss-oculta");
          let tabela = "<div class='verdeBranco'>HOSPITALAR - EXAMES</div>";
          tabela += `<div>`;
          tabela += `<table class="full-width">`;

          tabela += `<tr class='tituloTabela'>`;
          tabela += `<th class="width110">DATA/HORA</th>`;
          tabela += `<th class="fifth-width">PROCEDIMENTO</th>`;
          tabela += `<th class="fifth-width">UNIDADE</th>`;
          tabela += `<th class="fifth-width">RESULTADO</th>`;
          tabela += `</tr>`;
          tabela += `<tbody>`;
          json.forEach((api) => {
            tabela += `<tr>`;
            tabela += `<td valign='top'>${moment(api.DataExame).format(
              "DD/MM/YYYY HH:MM"
            )}</td>`;
            tabela += `<td valign='top'>${api.NomeProced || ""}</td>`;
            tabela += `<td valign='top'>${api.NomeHospital || ""}</td>`;
            tabela += `<td valign='top'>${api.resultado || ""}</td>`;
            tabela += `</tr>`;
          });
          tabela += `</tbody>`;
          tabela += `</table>`;
          tabela += `</div>`;
          tabela += `<br />`;
          $("[id='htmlApiHospidataExames']").html(tabela);
        }
      })
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      });
  } else {
    $("#htmlApiHospidataExames").addClass("sigss-oculta");
  }
}

//BUSCA API HOSPIDATA - EVOLUCOES
function buscaApiHospidataEvolucoes() {
  if (CONFIG.prontuarioIsBuscaHosp && varValidaApiHospidata === "t") {
    const data = { isenFullPKCrypto: isenFullPKCrypto };
    return get("prontuarioAmbulatorial2/buscaApiHospidataEvolucoes", data)
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json && json.length > 0) {
          $("#htmlApiHospidataEvolucoes").removeClass("sigss-oculta");
          let tabela = "<div class='verdeBranco'>HOSPITALAR - EVOLUCOES</div>";
          tabela += `<div>`;
          tabela += `<table class="full-width">`;

          tabela += `<tr class='tituloTabela'>`;
          tabela += `<th class="width110">DATA/HORA</th>`;
          tabela += `<th class="width110">Nº ATENDIMENTO</th>`;
          tabela += `<th class="fifth-width">DESCRIÇÃO</th>`;
          tabela += `<th class="fifth-width">TIPO EVOLUÇÃO</th>`;
          tabela += `<th class="fifth-width">CÓDIGO PRESCRIÇÃO</th>`;
          tabela += `<th class="fifth-width">PROFISSIONAL</th>`;
          tabela += `</tr>`;
          tabela += `<tbody>`;
          json.forEach((api) => {
            // CONVERTE RTF to PLAIN
            api.descricao = api.descricao.replace(/\\par[d]?/g, "");
            api.descricao = api.descricao.replace(
              /\{\*?\\[^{}]+}|[{}]|\\\n?[A-Za-z]+\n?(?:-?\d+)?[ ]?/g,
              ""
            );
            api.descricao = api.descricao
              .replace(/\\'[0-9a-zA-Z]{2}/g, "")
              .trim();

            tabela += `<tr>`;
            tabela += `<td valign='top'>${moment(api.dtEvolucao).format(
              "DD/MM/YYYY HH:MM"
            )}</td>`;
            tabela += `<td valign='top'>${api.nrAtendimento || ""}</td>`;
            tabela += `<td valign='top'>${api.descricao || ""}</td>`;
            tabela += `<td valign='top'>${api.tpEvolucao || ""}</td>`;
            tabela += `<td valign='top'>${api.codPrescricao || ""}</td>`;
            tabela += `<td valign='top'>${api.profissional || ""}</td>`;
            tabela += `</tr>`;
          });
          tabela += `</tbody>`;
          tabela += `</table>`;
          tabela += `</div>`;
          tabela += `<br />`;
          $("[id='htmlApiHospidataEvolucoes']").html(tabela);
        }
      })
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      });
  } else {
    $("#htmlApiHospidataEvolucoes").addClass("sigss-oculta");
  }
}

//BUSCA API HOSPIDATA - PRESCRICOES
function buscaApiHospidataPrescricoes() {
  if (CONFIG.prontuarioIsBuscaHosp && varValidaApiHospidata === "t") {
    const data = { isenFullPKCrypto: isenFullPKCrypto };
    return get("prontuarioAmbulatorial2/buscaApiHospidataPrescricoes", data)
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json && json.length > 0) {
          $("#htmlApiHospidataPrescricoes").removeClass("sigss-oculta");
          let tabela =
            "<div class='verdeBranco'>HOSPITALAR - PRESCRICOES</div>";
          tabela += `<div>`;
          tabela += `<table class="full-width">`;

          tabela += `<tr class='tituloTabela'>`;
          tabela += `<th class="width110">Nº ATENDIMENTO</th>`;
          tabela += `<th class="width110">CÓD. PRESCRIÇÃO</th>`;
          tabela += `<th class="fifth-width">INÍCIO VALIDADE</th>`;
          tabela += `<th class="fifth-width">PROFISSIONAL</th>`;
          tabela += `<th class="fifth-width">PRODUTO</th>`;
          tabela += `<th class="fifth-width">VIA</th>`;
          tabela += `<th class="fifth-width">OBSERVAÇÃO</th>`;
          tabela += `<th class="fifth-width">HORÁRIOS</th>`;
          tabela += `</tr>`;
          tabela += `<tbody>`;
          json.forEach((api) => {
            tabela += `<tr>`;
            tabela += `<td valign='top'>${api.nrAtendimento || ""}</td>`;
            tabela += `<td valign='top'>${api.codPrescricao || ""}</td>`;
            tabela += `<td valign='top'>${moment(api.inicioValidade).format(
              "DD/MM/YYYY HH:MM"
            )}</td>`;
            tabela += `<td valign='top'>${api.profissional || ""}</td>`;
            tabela += `<td valign='top'>${api.produto || ""}</td>`;
            tabela += `<td valign='top'>${api.via || ""}</td>`;
            tabela += `<td valign='top'>${api.observacao || ""}</td>`;
            tabela += `<td valign='top'>${api.horarios || ""}</td>`;
            tabela += `</tr>`;
          });
          tabela += `</tbody>`;
          tabela += `</table>`;
          tabela += `</div>`;
          tabela += `<br />`;
          $("[id='htmlApiHospidataPrescricoes']").html(tabela);
        }
      })
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      });
  } else {
    $("#htmlApiHospidataPrescricoes").addClass("sigss-oculta");
  }
}

//BUSCA API HOSPIDATA - SINAIS VITAIS
function buscaApiHospidataSinaisVitais() {
  if (CONFIG.prontuarioIsBuscaHosp && varValidaApiHospidata === "t") {
    const data = { isenFullPKCrypto: isenFullPKCrypto };
    return get("prontuarioAmbulatorial2/buscaApiHospidataSinaisVitais", data)
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json && json.length > 0) {
          $("#htmlApiHospidataSinaisVitais").removeClass("sigss-oculta");
          let tabela =
            "<div class='verdeBranco'>HOSPITALAR - SINAIS VITAIS</div>";
          tabela += `<div>`;
          tabela += `<table class="full-width">`;

          tabela += `<tr class='tituloTabela'>`;
          tabela += `<th class="fifth-width">DATA</th>`;
          tabela += `<th class="width110">Nº ATENDIMENTO</th>`;
          tabela += `<th class="width110">TEMPERATURA</th>`;
          tabela += `<th class="fifth-width">PESO</th>`;
          tabela += `<th class="fifth-width">ALTURA</th>`;
          tabela += `<th class="fifth-width">GLICEMIA</th>`;
          tabela += `<th class="fifth-width">FREQ. CARDÍACA</th>`;
          tabela += `<th class="fifth-width">FREQ. RESPIRATÓRIA</th>`;
          tabela += `<th class="fifth-width">CINTURA</th>`;
          tabela += `<th class="fifth-width">PRES. SISTÓLICA</th>`;
          tabela += `<th class="fifth-width">PRES. DIASTÓLICA</th>`;
          tabela += `<th class="fifth-width">PRES. MÉDIA</th>`;
          tabela += `</tr>`;
          tabela += `<tbody>`;
          json.forEach((api) => {
            const str =
              api.temperatura == null || api.temperatura == "undefined"
                ? ""
                : api.temperatura.substring(0, 5);

            tabela += `<tr>`;
            tabela += `<td valign='top'>${moment(api.dtSinal).format(
              "DD/MM/YYYY HH:MM"
            )}</td>`;
            tabela += `<td valign='top'>${api.nrAtendimento || ""}</td>`;
            tabela += `<td valign='top'>${str || ""}</td>`;
            tabela += `<td valign='top'>${api.peso || ""}</td>`;
            tabela += `<td valign='top'>${api.altura || ""}</td>`;
            tabela += `<td valign='top'>${api.glicemia || ""}</td>`;
            tabela += `<td valign='top'>${api.freqCardiaca || ""}</td>`;
            tabela += `<td valign='top'>${api.freqRespiratoria || ""}</td>`;
            tabela += `<td valign='top'>${api.cintura || ""}</td>`;
            tabela += `<td valign='top'>${api.pressaoSistolica || ""}</td>`;
            tabela += `<td valign='top'>${api.pressaoDiastolica || ""}</td>`;
            tabela += `<td valign='top'>${api.pressaoMedia || ""}</td>`;
            tabela += `</tr>`;
          });
          tabela += `</tbody>`;
          tabela += `</table>`;
          tabela += `</div>`;
          tabela += `<br />`;
          $("[id='htmlApiHospidataSinaisVitais']").html(tabela);
        }
      })
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      });
  } else {
    $("#htmlApiHospidataSinaisVitais").addClass("sigss-oculta");
  }
}

//BUSCA API HOSPIDATA - NOTA DE INTERNAÇÃO
function buscaApiHospidataNotaInternacao() {
  if (CONFIG.prontuarioIsBuscaHosp && varValidaApiHospidata === "t") {
    const data = { isenFullPKCrypto: isenFullPKCrypto };
    return get("prontuarioAmbulatorial2/buscaApiHospidataNotaInternacao", data)
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json && json.length > 0) {
          $("#htmlApiHospidataNotaInternacao").removeClass("sigss-oculta");
          let tabela =
            "<div class='verdeBranco'>HOSPITALAR - NOTA DE INTERNAÇÃO</div>";
          tabela += `<div>`;
          tabela += `<table class="full-width">`;

          tabela += `<tr class='tituloTabela'>`;
          tabela += `<th class="width110">Nº ATENDIMENTO</th>`;
          tabela += `<th class="width110">DATA INTERNAÇÃO</th>`;
          tabela += `<th class="width110">PREVISÃO DE ALTA</th>`;
          tabela += `<th class="width110">DATA DE ALTA</th>`;
          tabela += `<th class="fifth-width">MOTIVO INTERNAÇÃO</th>`;
          tabela += `<th class="fifth-width">REVISÃO DE FISICO</th>`;
          tabela += `<th class="fifth-width">HISTÓRICO DE DOENÇA</th>`;
          tabela += `<th class="fifth-width">HIPOTESE DIAGNÓSTICA</th>`;
          tabela += `<th class="fifth-width">HISTÓRIA PSIQUIATRICA</th>`;
          tabela += `<th class="fifth-width">CONDUTA INICIAL</th>`;
          tabela += `<th class="fifth-width">EXAME MENTAL</th>`;
          tabela += `<th class="fifth-width">QUEIXA</th>`;
          tabela += `</tr>`;
          tabela += `<tbody>`;
          json.forEach((api) => {
            tabela += `<tr>`;
            tabela += `<td valign='top'>${api.nrAtendimento || ""}</td>`;
            tabela += `<td valign='top'>${moment(api.dtInternacao).format(
              "DD/MM/YYYY HH:MM"
            )}</td>`;
            tabela += `<td valign='top'>${moment(api.dtPrevisaoAlta).format(
              "DD/MM/YYYY HH:MM"
            )}</td>`;
            tabela += `<td valign='top'>${moment(api.dtAlta).format(
              "DD/MM/YYYY HH:MM"
            )}</td>`;
            tabela += `<td valign='top'>${api.motivoInternacao || ""}</td>`;
            tabela += `<td valign='top'>${api.revisaoSistemaFisico || ""}</td>`;
            tabela += `<td valign='top'>${api.histDoenca || ""}</td>`;
            tabela += `<td valign='top'>${api.hipoteseDiagnostica || ""}</td>`;
            tabela += `<td valign='top'>${api.historiaPsiquiatrica || ""}</td>`;
            tabela += `<td valign='top'>${api.condutaInicial || ""}</td>`;
            tabela += `<td valign='top'>${api.exameMental || ""}</td>`;
            tabela += `<td valign='top'>${api.queixa || ""}</td>`;
            tabela += `</tr>`;
          });
          tabela += `</tbody>`;
          tabela += `</table>`;
          tabela += `</div>`;
          tabela += `<br />`;
          $("[id='htmlApiHospidataNotaInternacao']").html(tabela);
        }
      })
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      });
  } else {
    $("#htmlApiHospidataNotaInternacao").addClass("sigss-oculta");
  }
}

//BUSCA API HOSPIDATA - NOTA DE ALTA
function buscaApiHospidataNotaAlta() {
  if (CONFIG.prontuarioIsBuscaHosp && varValidaApiHospidata === "t") {
    const data = { isenFullPKCrypto: isenFullPKCrypto };
    return get("prontuarioAmbulatorial2/buscaApiHospidataNotaAlta", data)
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json && json.length > 0) {
          $("#htmlApiHospidataNotaAlta").removeClass("sigss-oculta");
          let tabela =
            "<div class='verdeBranco'>HOSPITALAR - NOTA DE ALTA</div>";
          tabela += `<div>`;
          tabela += `<table class="full-width">`;

          tabela += `<tr class='tituloTabela'>`;
          tabela += `<th class="width110">Nº ATENDIMENTO</th>`;
          tabela += `<th class="width110">PREVISÃO DE ALTA</th>`;
          tabela += `<th class="fifth-width">MOTIVO ALTA</th>`;
          tabela += `<th class="fifth-width">MOTIVO INTERNAÇÃO</th>`;
          tabela += `<th class="fifth-width">CONDIÇÕES DE HOSPITALIZAÇÃO</th>`;
          tabela += `<th class="fifth-width">EXAMES DE INVESTIGAÇÃO</th>`;
          tabela += `<th class="fifth-width">HIPOTESE DIAGNÓSTICA</th>`;
          tabela += `<th class="fifth-width">CONDIÇÃO DE ALTA</th>`;
          tabela += `<th class="fifth-width">DIAGNÓSTICO DE ALTA</th>`;
          tabela += `<th class="fifth-width">EVOLUÇÃO</th>`;
          tabela += `<th class="fifth-width">RECOMENDAÇÃO PÓS ALTA</th>`;
          tabela += `<th class="fifth-width">CONTEXTO FAMILIAR</th>`;
          tabela += `</tr>`;
          tabela += `<tbody>`;
          json.forEach((api) => {
            tabela += `<tr>`;
            tabela += `<td valign='top'>${api.nrAtendimento || ""}</td>`;
            tabela += `<td valign='top'>${moment(api.previsaoAlta).format(
              "DD/MM/YYYY HH:MM"
            )}</td>`;
            tabela += `<td valign='top'>${api.motivoAlta || ""}</td>`;
            tabela += `<td valign='top'>${api.motivoInternacao || ""}</td>`;
            tabela += `<td valign='top'>${
              api.condicoesHospitalizacao || ""
            }</td>`;
            tabela += `<td valign='top'>${api.examesInvestigacao || ""}</td>`;
            tabela += `<td valign='top'>${api.hipoteseDiagnostica || ""}</td>`;
            tabela += `<td valign='top'>${api.condicaoAlta || ""}</td>`;
            tabela += `<td valign='top'>${api.diagnosticoAlta || ""}</td>`;
            tabela += `<td valign='top'>${api.evolucao || ""}</td>`;
            tabela += `<td valign='top'>${api.recomendacaoPosAlta || ""}</td>`;
            tabela += `<td valign='top'>${api.contextoFamiliar || ""}</td>`;
            tabela += `</tr>`;
          });
          tabela += `</tbody>`;
          tabela += `</table>`;
          tabela += `</div>`;
          tabela += `<br />`;
          $("[id='htmlApiHospidataNotaAlta']").html(tabela);
        }
      })
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      });
  } else {
    $("#htmlApiHospidataNotaAlta").addClass("sigss-oculta");
  }
}

async function validaApiHospidata() {
  if (CONFIG.prontuarioIsBuscaHosp) {
    const data = { isenFullPKCrypto: isenFullPKCrypto };

    return new Promise((resolve, reject) => {
      get("prontuarioAmbulatorial2/validaApiHospidata", data)
        .then(() => {
          resolve("t");
        })
        .fail((xhr, status, error) => {
          xhr.responseText = decodeHtmlEntities(xhr.responseText);
          resultValidator(xhr, error);
          resolve("f");
        });
    });
  } else {
    return Promise.resolve("f");
  }
}

//BUSCA API IDS - PRONTUÁRIO
function buscaApiIdsExterno() {
  if (CONFIG.addInfoIdsProntuario) {
    const data = { isenFullPKCrypto: isenFullPKCrypto };
    return get("prontuarioAmbulatorial2/buscaApiIdsExterno", data)
      .then((json) => {
        json = decodeHtmlEntitiesInJson(json);
        if (json.atendimentos && json.atendimentos.length > 0) {
          $("#htmlApiAtendimentoIds").removeClass("sigss-oculta");
          let tabela =
            "<div class='verdeBranco'>Histórico Hospitalar - Atendimentos</div>";
          tabela += `<div>`;
          tabela += `<table class="full-width">`;

          let atendimentoSeq = 1;

          tabela += `<tr><td colspan="13" style="background-color: #cccccc; text-align: center; font-weight: bold; font-size: 1.2em;">Atendimento ${atendimentoSeq}</td></tr>`;
          atendimentoSeq++;

          const headerRow = `
                    <tr class='tituloTabela'>
                        <th class="twentieth-width">Rotina</th>
                        <th class="twentieth-width">Sistema</th>
                        <th class="twentieth-width">Ficha código</th>
                        <th class="half-five-width">Ficha Data</th>
                        <th class="twentieth-width">Código do Usuario</th>
                        <th class="half-five-width">Horario</th>
                        <th class="twentieth-width">Razão social da unidade</th>
                        <th class="twentieth-width">Unidade CNES</th>
                        <th class="twentieth-width">Nome do profissional</th>
                        <th class="twentieth-width">Descrição da especialidade</th>
                        <th class="half-five-width">Sigla especialidade</th>
                        <th class="fifth-width">Anamnese</th>
                        <th class="fifth-width">Dados Clínicos</th>
                    </tr>`;

          tabela += headerRow;
          tabela += `<tbody>`;

          function formatDate(dateString) {
            const [year, month, day] = dateString.split("-");
            return `${day}/${month}/${year}`;
          }

          json.atendimentos.forEach((api, index) => {
            tabela += `<tr>`;
            tabela += `<td valign='top'>${api.atendimento.rotina || ""}</td>`;
            tabela += `<td valign='top'>${api.atendimento.sistema || ""}</td>`;
            tabela += `<td valign='top'>${
              api.atendimento.fichaCodigo || ""
            }</td>`;
            tabela += `<td valign='top'>${
              api.atendimento.fichaData || ""
            }</td>`;
            tabela += `<td valign='top'>${
              api.atendimento.usuarioCodigo || ""
            }</td>`;
            tabela += `<td valign='top'>${
              (api.atendimento.horario &&
                api.atendimento.horario.split("T")[1]) ||
              ""
            }</td>`;
            tabela += `<td valign='top'>${
              api.atendimento.unidadeRazaoSocial || ""
            }</td>`;
            tabela += `<td valign='top'>${
              api.atendimento.unidadeCnes || ""
            }</td>`;
            tabela += `<td valign='top'>${
              api.atendimento.profissionalNome || ""
            }</td>`;
            tabela += `<td valign='top'>${
              api.atendimento.especialidadeDescricao || ""
            }</td>`;
            tabela += `<td valign='top'>${
              api.atendimento.especialidadeSigla || ""
            }</td>`;
            tabela += `<td valign='top'>${
              api.atendimento.anamneseHDA || ""
            }</td>`;
            tabela += `<td valign='top'>${
              api.atendimento.dadosClinicos || ""
            }</td>`;
            tabela += `</tr>`;

            if (api.prescricoes && api.prescricoes.length > 0) {
              tabela += `<tr><td colspan="13" style="background-color: #cccccc; font-weight: bold; font-size: 1em;">Prescrições</td></tr>`;
              api.prescricoes.forEach((presc) => {
                const prescDataFormatted = formatDate(presc.fichaData || "");
                tabela += `<tr><td colspan="13" style="padding: 8px 0;">${prescDataFormatted} - ${
                  presc.medicamentoDescricao || ""
                }, ${presc.unidadeMedidaSigla || ""}, ${
                  presc.quantidade || ""
                }, ${presc.posologia || ""}</td></tr>`;
              });
            }

            if (api.solicitacaoExames && api.solicitacaoExames.length > 0) {
              tabela += `<tr><td colspan="13" style="background-color: #cccccc; font-weight: bold; font-size: 1em;">Solicitações de Exame</td></tr>`;
              api.solicitacaoExames.forEach((exame) => {
                const exameDataFormatted = formatDate(exame.fichaData || "");
                tabela += `<tr><td colspan="13" style="padding: 8px 0;">${exameDataFormatted} - ${
                  exame.exameDescricao || ""
                }, ${exame.procedimentoClassificacao || ""}</td></tr>`;
              });
            }

            if (index < json.atendimentos.length - 1) {
              tabela += `<tr><td colspan="13" style="background-color: #cccccc; text-align: center; font-weight: bold; font-size: 1.2em;">Atendimento ${atendimentoSeq}</td></tr>`;
              atendimentoSeq++;
              tabela += headerRow;
            }
          });

          tabela += `</tbody>`;
          tabela += `</table>`;
          tabela += `</div>`;
          tabela += `<br />`;
          $("[id='htmlApiAtendimentoIds']").html(tabela);
        }
      })
      .fail((xhr, status, error) => {
        resultValidator(xhr, error);
      });
  }
}

function buscaDadosRegulacao() {
  const parametros = {
    isenFullPKCrypto: isenFullPKCrypto,
    dataInicial: dataInicial,
    dataFinal: dataFinal,
  };

  return get("prontuarioAmbulatorial2/buscaDadosRegulacao_HTML", parametros)
    .fail((xhr, status, error) => {
      resultValidator(xhr, error);
    })
    .then((json) => {
      json = decodeHtmlEntitiesInJson(json);
      if (json.tabela) {
        $("[id='htmlDadosRegulacao']").html(json.tabela);
      }
    });
}

function buscaDadosIntegracaoAPAC(mostrar) {
  if (mostrar !== "t" || !CONFIG.isUtlIntegracaoApac) {
    return;
  }

  const params = {
    isenFullPKCrypto: isenFullPKCrypto,
    dataInicial: dataInicial,
    dataFinal: dataFinal,
  };

  const url = "prontuarioAmbulatorial2/buscaDadosIntegracaoAPAC";
  const idElemento = '[id="htmlDadosIntegracaoAPAC"]';

  $(idElemento).addClass("sigss-oculta");

  return get(url, params)
    .fail((xhr, status, error) => {
      resultValidator(xhr, error);
    })
    .then((json) => {
      json = decodeHtmlEntitiesInJson(json);
      if (json.length > 0) {
        $(idElemento).removeClass("sigss-oculta");

        let apacIntegraDOM =
          "<div class='verdeBranco'>PROCEDIMENTOS DE ALTA COMPLEXIDADE (APAC)</div>";
        apacIntegraDOM += "<div>";

        json.forEach((apacIntegracao) => {
          apacIntegraDOM += "<table class='marginBt4ApacIntegra'>";
          apacIntegraDOM += "<thead>";
          apacIntegraDOM += "<tr class='tituloTabela'>";
          apacIntegraDOM +=
            "<th class='width120 alinhadoEsquerda'>DATA/HORA SOLIC.</th>";
          apacIntegraDOM +=
            "<th class='width110 alinhadoEsquerda'>Nº SOLICITAÇÃO</th>";
          apacIntegraDOM +=
            "<th class='width300 alinhadoEsquerda'>UNIDADE SOLICITANTE</th>";
          apacIntegraDOM +=
            "<th class='width300 alinhadoEsquerda'>PROFISSIONAL SOLICITANTE</th>";
          apacIntegraDOM +=
            "<th class='width150 alinhadoEsquerda'>STATUS SOLICITAÇÃO</th>";
          apacIntegraDOM +=
            "<th class='width100 alinhadoEsquerda'>Nº APAC</th>";
          apacIntegraDOM +=
            "<th class='width150 alinhadoEsquerda'>TIPO DE LAUDO</th>";
          apacIntegraDOM += "</tr>";
          apacIntegraDOM += "</thead>";
          apacIntegraDOM += "<tbody>";
          apacIntegraDOM += "<tr>";
          apacIntegraDOM += `<td>${normalizaStr(
            apacIntegracao.dhSolicitacaoFormatada
          )}</td>`;
          apacIntegraDOM += `<td>${normalizaStr(
            apacIntegracao.cdSolicitacaoApac
          )}</td>`;
          apacIntegraDOM += `<td>${normalizaStr(
            apacIntegracao.unidadeSolicitante
          )}</td>`;
          apacIntegraDOM += `<td>${normalizaStr(
            apacIntegracao.profissionalSolicitante
          )}</td>`;
          apacIntegraDOM += `<td>${normalizaStr(
            apacIntegracao.statusSolicitacao
          )}</td>`;
          apacIntegraDOM += `<td>${normalizaStr(apacIntegracao.nrApac)}</td>`;
          apacIntegraDOM += `<td>${normalizaStr(
            apacIntegracao.tipoLaudo
          )}</td>`;
          apacIntegraDOM += "</tr>";
          apacIntegraDOM += "</tbody>";
          apacIntegraDOM += "</table>";

          apacIntegraDOM += "<div class='layout-row'>";
          apacIntegraDOM += "<div class='marginLf120ApacIntegra'>";
          apacIntegraDOM += `<div class='marginBt4ApacIntegra'><span class='boldApacIntegra'>UNIDADE EXECUTANTE: </span>${normalizaStr(
            apacIntegracao.unidadeExecutante
          )}</div>`;
          apacIntegraDOM += `<div class='marginBt4ApacIntegra'><span class='boldApacIntegra'>PROFISSIONAL EXECUTANTE: </span> ${normalizaStr(
            apacIntegracao.profissionalExecutante
          )}</div>`;
          apacIntegraDOM += `<div class='marginBt4ApacIntegra'><span class='boldApacIntegra'>PERÍODO DE VALIDADE: </span>${normalizaStr(
            apacIntegracao.periodoValidade
          )}</div>`;
          apacIntegraDOM += `<div class='marginBt4ApacIntegra'><span class='boldApacIntegra'>COMPETÊNCIA DE CONSOLIDAÇÃO: </span>${normalizaStr(
            apacIntegracao.competenciaConsolidacao
          )}</div>`;
          apacIntegraDOM += `<div class='marginBt4ApacIntegra'><span class='boldApacIntegra'>DATA/HORA DE CONSOLIDAÇÃO: </span>${normalizaStr(
            apacIntegracao.dhConsolidacao
          )}</div>`;
          apacIntegraDOM += `<div class='marginBt4ApacIntegra'><span class='boldApacIntegra'>STATUS AUDITOR: </span>${normalizaStr(
            apacIntegracao.statusAuditor
          )}</div>`;
          apacIntegraDOM += "</div>";
          apacIntegraDOM += "<div class='marginLf100ApacIntegra'>";
          apacIntegraDOM += `<div class='marginBt4ApacIntegra'><span class='boldApacIntegra'>PROCEDIMENTO PRINCIPAL: </span>${normalizaStr(
            apacIntegracao.procedimentoPrincipal
          )}</div>`;
          apacIntegraDOM += `<div class='marginBt4ApacIntegra'><span class='boldApacIntegra'>DEMAIS PROCEDIMENTOS: </span>${normalizaStr(
            apacIntegracao.demaisProcedimentos
          )}</div>`;
          apacIntegraDOM += `<div class='marginBt4ApacIntegra'><span class='boldApacIntegra'>CID PRINCIPAL: </span>${normalizaStr(
            apacIntegracao.cidPrincipal
          )}</div>`;
          apacIntegraDOM += `<div class='marginBt4ApacIntegra'><span class='boldApacIntegra'>DEMAIS CIDs: </span>${normalizaStr(
            apacIntegracao.cidAssociado
          )}</div>`;
          apacIntegraDOM += `<div class='marginBt4ApacIntegra'><span class='boldApacIntegra'>MOTIVO DE SAÍDA/PERMANÊNCIA: </span>${normalizaStr(
            apacIntegracao.dsMotivoSaidaPermanencia
          )}</div>`;
          apacIntegraDOM += "</div>";
          apacIntegraDOM += "</div>";

          apacIntegraDOM +=
            "<div><hr class='separadorApacIntegra marginBt4ApacIntegra' /></div>";
        });
        apacIntegraDOM += "</div>";
        apacIntegraDOM += "<br />";

        $(idElemento).html(apacIntegraDOM);
      }
    });
}

function normalizaStr(str) {
  return str ? str : "";
}
