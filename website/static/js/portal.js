/*! Portal v1.0.0 */

// 

function navigate() {
    $('a').on('click', function (event) {
        console.log("click to href");
        var href = $(this).attr('href');
        console.log("localStorage token = " + localStorage.getItem("token"));
        if (href !== "") {
            console.log("href = " + href);
            (async () => {
                await fetch(href, {
                    headers: {
                        Authentication: "Bearer " + localStorage.getItem("token")
                    }
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error('Error occurred!')
                        }
                        return response.text()
                    })
                    .then((data) => {
                        if (href === "/web") {
                            console.log("main page");
                            document.close();
                            document.write(data);
                        } else {
                            $("#content").replaceWith(data);
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        redirectAuth();
                    });
            })();
        };
        return false;
    });
}

function redirectAuth() {
    fetch("/auth/denied")
        .then((response) => response.text())
        .then((data) => {
            document.close();
            document.write(data);
        })
}

function checkAuth() {
    $('#authModalWindow').modal('show');
    setTimeout(() => {
        console.log("localStorage token = " + localStorage.getItem("token"));
        if (localStorage.getItem("token") === null) {
            $('#authModalWindow').modal('hide');
            console.log("/auth/denied")
            redirectAuth();
        } else {
            fetch("/web", {
                headers: {
                    Authentication: "Bearer " + localStorage.getItem("token")
                }
            })
                .then((response) => {
                    if (!response.ok) {
                        if (response.status == 401) {
                            redirectAuth();
                        }
                    }
                    return response.text()
                })
                .then((data) => {
                    $('#authModalWindow').modal('hide');
                    $('body').html(data);

                })
        }
    }, 500);
}

function submitFormAuth() {
    // console.log("auth doc ready")
    $("#loginForm").submit(function (event) {
        var formData = new FormData();
        formData.append("login", $("#login").val());
        formData.append("pass", $("#password").val());
        // console.log(formData);

        fetch("/auth/signin", {
            method: 'POST',
            body: formData,
        })
            .then((response) => {
                if (!response.ok) {
                    if (response.status == 404) {
                        $('#messages').addClass('alert alert-danger').text("Пользователь не найден! Проверьте правильность ввода!");
                    } else {
                        // console.log(response.json().message);
                        throw new Error(response.json().message);
                    }
                }
                return response.json()
            })
            .then((data) => {
                if (data.type == "success") {
                    localStorage.setItem("token", data.token);
                    // console.log("token = " + data.token);

                    // всё ок - переходим на главную
                    checkAuth();
                } else {
                    $('#messages').addClass('alert alert-danger').text(data.message)
                }
            })
            .catch((error) => {
                // console.error('resp err:', error);
                $('#messages').addClass('alert alert-danger').text(error)
            });
        event.preventDefault();
    });
}

function subFormReg() {
    $("#regForm").submit(function (event) {
        event.preventDefault();
        var form = document.querySelector('#regForm');
        var formData = new FormData(form);
        (async () => {
            let resp = await fetch("/auth/register", {
                method: 'POST',
                body: formData,
            });
            if (resp.ok) {
                $('#messages').removeClass();
                $('#messages').addClass('alert alert-success').text(await resp.text());
            } else {
                if (resp.status == 400) {
                    $('#messages').removeClass();
                    $('#messages').addClass('alert alert-warning').text(await resp.text());
                } else {
                    $('#messages').removeClass();
                    $('#messages').addClass('alert alert-danger').text(error);
                }
            }
        })();
    });
}

function checkHeaderExist() {
    if (!$("head")) {
        console.log("head is empty")
        fetch("/")
    }
}

function initShare() {
    getTree();
    subFormUploadFile();
    openUploadFileModalWindow();
    showOrDownloadFile();
    downloadFile();
    deleteFile();
}

function getTree() {
    (async () => {
        await fetch('/web/share/gettree', {
            headers: {
                Authentication: "Bearer " + localStorage.getItem("token")
            }
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Error occurred!')
                }
                return response.json()
            })
            .then((respJSON) => {
                // console.log(respJSON);
                $('#tree').empty();
                $('#tree').removeData();
                $('#tree').bstreeview({
                    data: respJSON,
                    expandIcon: 'fa fa-angle-down fa-fw',
                    collapseIcon: 'fa fa-angle-right fa-fw',
                    indent: 1.25,
                    parentsMarginLeft: '0.5rem',
                    openNodeLinkOnNewTab: false
                });
            })
            .catch((error) => {
                console.log(error);
                // TODO вывести ошибку на страницу
            });
    })();
}

function showOrDownloadFile() {
    $(document).off('click', '.get_file').on('click', '.get_file', function (event) {
        event.preventDefault();
        // очистка элемента, если была ошибка
        $("#deleteFile").removeClass('alert').removeClass('alert-danger');
        // console.log("get_file click");
        var id = event.target.id;
        var fileName = event.target.textContent;
        var ext = fileName.split('.').pop()
        if (ext === "pdf") {
            $("#waitLoadingPDF").removeClass('invisible');
            console.log("get_file pdf");
            let url = "/web/share/getpdffile/" + id;
            (async () => {
                const gd = await fetch(url, {
                    headers: {
                        Authentication: "Bearer " + localStorage.getItem("token")
                    }
                });
                console.log("wait data!");
                let blob = await gd.blob();
                console.log("data is here!");
                let link = window.URL.createObjectURL(blob);
                console.log("link = " + link);
                $("#showPDF").prop('src', link)
                $("#messageShowOrDownloadFile").html('Нажмите <div class="download_file badge bg-primary text-wrap" id="/web/share/getfile/' + id + '" name="' + fileName + '">' + fileName + '</div> для скачивания!');
                $("#deleteFile").html('Нажмите <div class="delete_file badge bg-danger text-wrap" id="/web/share/delfile/' + id + '" name="' + fileName + '">' + fileName + '</div> для удаления!');
                $("#waitLoadingPDF").addClass('invisible');
            })();
        } else {
            $("#waitLoadingPDF").addClass('invisible');
            $("#showPDF").prop('src', "")
            $("#messageShowOrDownloadFile").html('Просмотр не возможен. Нажмите <div class="download_file badge bg-primary text-wrap" id="/web/share/getfile/' + id + '" name="' + fileName + '">' + fileName + '</div> для скачивания!');
            $("#deleteFile").html('Нажмите <div class="delete_file badge bg-danger text-wrap" id="/web/share/delfile/' + id + '" name="' + fileName + '">' + fileName + '</div> для удаления!');
        }
    });
}

function downloadFile() {
    $(document).off('click', '.download_file').on('click', '.download_file', function (event) {
        event.preventDefault();
        // var name = event.target.outerText;
        var url = event.target.id;
        // console.log("click .download_file");
        // console.log("name " + name);
        // console.log("url " + url);
        (async () => {
            const gd = await fetch(url, {
                headers: {
                    Authentication: "Bearer " + localStorage.getItem("token")
                }
            });
            // console.log("wait data!");
            let blob = await gd.blob();
            if (gd.status == 500) {
                $("#messageShowOrDownloadFile").html('Произошла ошибка при скачивании файла. Текст ошибки: ' + blob.text);
            } else {
                // console.log("data is here!");
                let a = document.createElement('a');
                a.href = window.URL.createObjectURL(blob);
                a.download = event.target.outerText;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(a.href);
            }
        })();
    });
}

function deleteFile() {
    $(document).off('click', '.delete_file').on('click', '.delete_file', function (event) {
        event.preventDefault();

        var url = event.target.id;
        // console.log("click .delete_file");
        // console.log("name " + name);
        // console.log("url " + url);
        (async () => {
            let resp = await fetch(url, {
                method: 'DELETE',
                headers: {
                    Authentication: "Bearer " + localStorage.getItem("token")
                }
            });
            let respText = await resp.text();
            if (!resp.ok) {
                $("#deleteFile").addClass('alert alert-danger').html('Произошла ошибка при удалении файла. Текст ошибки: ' + respText);
            } else {
                // показ всплывающего окна
                console.log(respText);
                showToast("Удаление файла!", respText);
                getTree();
                $("#messageShowOrDownloadFile").empty();
                $("#deleteFile").empty();
            }
        })();
    });
}

function openUploadFileModalWindow() {
    $(document).off('click', '.add_file').on('click', '.add_file', function (event) {
        console.log("UploadModal");
        event.preventDefault();
        $('#uploadFileModalWindow').modal('show');
        pathUploadFile = event.target.id
        console.log("UploadModal id = " + pathUploadFile);
    });
}

function subFormUploadFile() {
    $("#UploadForm").submit(function (event) {
        event.preventDefault();
        var file = document.getElementsByName("file")[0].files[0];
        var fileName = pathUploadFile + file.name;
        file.name = fileName;
        console.log(file);
        var formData = new FormData();
        formData.append("file", file, fileName);
        console.log(formData);

        fetch("/web/share/upload", {
            method: 'POST',
            body: formData,
            headers: {
                Authentication: "Bearer " + localStorage.getItem("token")
            }
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(response.text());
                }
                return response.text()
            })
            .then((data) => {
                $('#uploadFileModalWindow').modal('hide');
                showToast("Загрузка файла на сервер!", "Файл " + data + " успешно отправлен!");
                getTree();
                console.log(data);
            })
            .catch((error) => {
                console.log(error);
                showToast("Загрузка файла на сервер!", "При отправке файла " + data + " произошла ошибка: " + error, true);
            });
    })
}

function showToast(head, body, error) {
    $("#addNoteToastBody").empty();
    $("#toastHeaderText").empty();
    let html = ""
    if (error) {
        html = '<i class="fa fa-question-circle" style="color:red"></i> <p style="color:red">' + body + '</p>'
    } else {
        html = '<p style="color:green"><i class="fa fa-check" style="color:green"></i>' + body + '</p>'
    }
    $("#addNoteToastBody").append(html);
    $("#toastHeaderText").text(head);
    var toast = document.getElementById('addNoteToast')
    var bsAlert = new bootstrap.Toast(toast);
    bsAlert.show();
}

function getStat() {
    $("#buttonGetStat").click(function (event) {
        event.preventDefault();
        $('#statMessage').removeClass().text("")
        var idStat = $('select[name=chooseStat]').val();
        var statText = $('#inputGroupSelectStat option:selected').text();
        var yearStat = $('#yearStat').val();
        var radioCheck = $('input[name="statbtnradio"]:checked').val();
        if (idStat > 0 && yearStat != "" && radioCheck > 0) {
            var url = "/web/statistic/getreport"
            if (radioCheck == 1) {
                (async () => {
                    url += "/" + idStat + "/" + yearStat
                    const gd = await fetch(url, {
                        headers: {
                            Authentication: "Bearer " + localStorage.getItem("token")
                        }
                    });
                    console.log("wait data!");
                    let blob = await gd.blob();
                    console.log("data is here!");
                    let a = document.createElement('a');
                    a.href = window.URL.createObjectURL(blob);
                    a.download = statText + "_" + yearStat + ".xlsx";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(a.href);
                })();
            } else {
                url = "/web/statistic/getstatmodel"
                // var formData = new FormData();
                // formData.append("id", idStat);
                // formData.append("year", yearStat);
                // TODO сделать вывод отчёта на страницу в виде таблицы
            }
        } else {
            $('#statMessage').addClass('alert alert-warning').text("Необходимо выбрать отчёт и/или заполнить год")
        }
    })
}

function initNet() {
    setNode();
    editNode();
    deleteNode();
    showNetbyParam();
    modalNetSettings();
    getNet();
    // updateStatusPing();
    modalAssigningIP();
    websocketListener();
}

function setNode() {
    $("#btnSetNode").click(function (event) {
        event.preventDefault();
        var formData = new FormData();
        formData.append("ipAddr", $('#formIPAddr').text());
        formData.append("addr", $('select[name=chooseAddrModal]').val());
        formData.append("typeDevice", $('select[name=chooseTypeDevice]').val());
        formData.append("floor", $("#floor").val());
        formData.append("room", $("#room").val());
        formData.append("name", $("#nameDevice").val());
        formData.append("notes", $("#comment").val());
        (async () => {
            var resp = await fetch("/web/net/setnode", {
                method: 'POST',
                body: formData,
                headers: {
                    Authentication: "Bearer " + localStorage.getItem("token")
                }
            });
            if (resp.status == 200) {
                // очистка формы
                $('#formIPAddr').val("");
                $('select[name=chooseAddrModal]').val(0);
                $('select[name=chooseTypeDevice]').val(1);
                $("#floor").val("");
                $("#room").val("");
                $("#nameDevice").val("");
                $("#comment").val("");
                // закрытие формы
                $("#modalSetNode .btn-close").click();
                // показ всплывающего окна
                showToast("Назначение IP адреса!", await resp.text());
                $("#buttonGetNet").click();
            } else {
                let respText = await resp.text();
                $("#messagesSetNode").addClass('alert alert-danger').text(respText);
                document.getElementById('modalSetNode').addEventListener('hide.bs.modal', function () {
                    $('#messagesSetNode').removeClass('alert').removeClass('alert-danger').empty();
                });
            }
        })();
    })
}

function editNode() {
    $(document).off('click', '.editIPAddr').on('click', '.editIPAddr', function (event) {
        ip = event.target.getAttribute("value")
        // console.log("ip .editIPAddr = " + ip)
        $('#formIPAddr').text(ip)
        // запрос на получение данных ноды по IP адресу для заполнения полей формы
        // TODO сделать GET запрос
        // let ipToJSON = { ip: ip };
        // ipToJSON.ip = ip
        // var formData = new FormData();
        // formData.append("ip", ip);
        let url = "/web/net/getnode/" + ip + "";
        (async () => {
            var resp = await fetch(url, {
                // method: 'POST',
                // body: formData,
                headers: {
                    Authentication: "Bearer " + localStorage.getItem("token")
                }
            });
            if (resp.ok) {
                // console.log("resp= ok");
                let data = await resp.json();
                // console.log(data);
                $('#formIPAddr').text(data.ip);
                $('select[name=chooseAddrModal]').val(data.address);
                $('select[name=chooseTypeDevice]').val(data.type);
                $("#floor").val(data.floor);
                $("#room").val(data.room);
                $("#nameDevice").val(data.name);
                $("#comment").val(data.notes);
            };
        })();
    });
}

function deleteNode() {
    // Запись в модальное окно IP адреса
    $(document).off('click', '.deleteIPAddr').on('click', '.deleteIPAddr', function (event) {
        ip = event.target.getAttribute("value")
        $('#formDeleteNodeIP').text(ip)
    });

    $("#confirmDeleteNode").click(function (event) {
        event.preventDefault();
        var ip = $("#formDeleteNodeIP").text()
        //   console.log("ip formDeleteNodeIP = " + ip)
        var formData = new FormData();
        formData.append("ip", ip);
        (async () => {
            var resp = await fetch("/web/net/freeing", {
                method: 'POST',
                body: formData,
                headers: {
                    Authentication: "Bearer " + localStorage.getItem("token")
                }
            });
            if (resp.status == 200) {
                //   console.log("resp.status == 200")
                $("#modalDeleteNode .btn-close").click();
                showToast("Освобождение IP адреса!", await resp.text());
                $("#buttonGetNet").click();
            }
        })();
    });
}

function showNetbyParam() {
    // Переключение радио кнопки показа информации по зданию или подсети
    $(document).off('click', '.netShowSelector').on('click', '.netShowSelector', function (event) {
        var radioCheck = $('input[name="netbtnradio"]:checked').val();
        var bySubNet = document.getElementsByClassName('bySubNet')[0];
        var byAddr = document.getElementsByClassName('byAddr')[0];
        if (radioCheck == 2) {
            bySubNet.classList.remove("d-none");
            byAddr.classList.add("d-none");
        } else {
            byAddr.classList.remove("d-none");
            bySubNet.classList.add("d-none");
        }
    });
    // Переключение видимости свободных IP адресов
    $('#btnToggleColapseFreeIP').click(function (event) {
        if ($("#collapseFreeIP").hasClass('show')) {
            $("#collapseFreeIP").removeClass('show');
            $("#btnToggleColapseFreeIP").text("Показать свободные IP адреса");
        } else {
            $("#collapseFreeIP").addClass('show');
            $("#btnToggleColapseFreeIP").text("Скрыть свободные IP адреса");
        }
    });
    // Переключение радио кнопок с отображением нужного элемента в модальном окне настроек
    $(document).off('click', '.settingShowSelector').on('click', '.settingShowSelector', function (event) {
        var radioCheck = $('input[name="settingbtnradio"]:checked').val();
        var listParam = document.getElementsByClassName('hideEach');
        for (var i = 0; i < listParam.length; i++) {
            if (i == radioCheck) {
                listParam[i].classList.remove("d-none");
            } else {
                listParam[i].classList.add("d-none");
            }
        }
    });
}

function modalNetSettings() {
    $("#saveSettings").click(function (event) {
        event.preventDefault();
        var radioCheck = $('input[name="settingbtnradio"]:checked').val();
        var formData = new FormData();
        var toastHeader = "";
        formData.append("index", radioCheck);
        if (radioCheck == '0') {
            formData.append("addBuild", $("#addBuild").val());
            toastHeader = "Добавление здания:";
        }
        if (radioCheck == '1') {
            formData.append("addSubnet", $("#addSubnet").val());
            formData.append("addSubnetBuild", $('select[name=chooseAddSubnetBuild]').val());
            toastHeader = "Добавление подсети с привязкой к зданию:";
        }
        if (radioCheck == '2') {
            formData.append("deleteBuild", $('select[name=chooseDeleteBuild]').val());
            toastHeader = "Удаление здания:";
        }
        if (radioCheck == '3') {
            formData.append("deleteSubnet", $('select[name=chooseDeleteSubnet]').val());
            toastHeader = "Удаление подсети:";
        }
        (async () => {
            let resp = await fetch("/web/net/settings", {
                method: 'POST',
                body: formData,
                headers: {
                    Authentication: "Bearer " + localStorage.getItem("token")
                }
            });
            if (resp.ok) {
                // console.log("saveSettings resp= ok")
                $("#modalNetSettings .btn-close").click();
                showToast(toastHeader, await resp.text());
                $("#hrefMainNet").click();
            } else {
                // console.log("saveSettings - resp NOT 200");
                $("#messagesNetSettings").empty();
                let restText = await resp.text();
                // console.log("resp text error = " + restText);
                $('#messagesNetSettings').addClass('alert alert-danger').text(restText);
                document.getElementById('modalNetSettings').addEventListener('hide.bs.modal', function () {
                    $('#messagesNetSettings').removeClass('alert').removeClass('alert-danger').empty();
                });
            }
        })();
    });

}

function updateStatusPing() {
    // если в div showNet нет attr running - то запускаем тикер
    if ($('#hrefMainNet').attr("running") == "") {
        console.log("running is run :)");
        $('#hrefMainNet').attr("running", "run");
        setInterval(function () {
            // console.log("updateStatusPing is running");
            // если в div showNet есть данные, то раз в 3 сек запрашиваем обновление статусов
            if ($('#showNet').text() != "") {
                // console.log("ticker run");
                (async () => {
                    let resp = await fetch("/web/net/getstatusip", {
                        headers: {
                            Authentication: "Bearer " + localStorage.getItem("token")
                        }
                    });
                    if (resp.ok) {
                        if (resp.status == 204) {
                            // console.log("updateStatusPing resp= 204");
                        } else {
                            // цикл по IP адресам с заменой статуса на странице
                            console.log("updateStatusPing - resp = 200");
                            let data = await resp.json();
                            console.log(data);
                            $.each(data, function (index, obj) {
                                console.log("obj.name = " + data[index].name);
                                console.log("obj.html = " + data[index].html);
                                $("td[nametd='" + data[index].name + "']").html(data[index].html);
                            });
                        }
                    } else {
                        console.log("updateStatusPing - resp NOT 200");
                    }
                })();
            }
        }, 3000);
    }
}

function getNet() {
    $("#buttonGetNet").click(function (event) {
        event.preventDefault();
        $('#showNet').empty();
        $('#netMessage').removeClass().empty();
        var valNet = $('select[name=chooseSubNet]').val();
        var valAddr = $('select[name=chooseAddr]').val();
        var radioCheck = $('input[name="netbtnradio"]:checked').val();
        // console.log(valNet)
        // console.log(valAddr)
        // console.log(radioCheck)
        var formData = new FormData();
        var url = "/web/net/"

        // TODO При выборе всех адресов или всех подсетей в цикле отправлять запросы и выводить последовательно результат на страницу
        if (radioCheck == '1') {
            url += "shownetbyaddr"
            formData.append("addr", valAddr);
        } else {
            url += "shownetbyip"
            formData.append("net", valNet);
        }
        // console.log(url);
        // console.log("wait data!");

        // запрос на получение данных по занятым IP адресам
        (async () => {
            await fetch(url, {
                method: 'POST',
                body: formData,
                headers: {
                    Authentication: "Bearer " + localStorage.getItem("token")
                }
            })
                .then(response => response.text())
                .then((html) => {
                    $('#showNet').empty();
                    // console.log("data is here!");
                    $('#showNet').append(html);
                    // установка фокуса для работы тикера
                    $('#showNet').focus();

                    // запрос на получение свободных IP адресов
                    (async () => {
                        let resp = await fetch("/web/net/getfreeip", {
                            headers: {
                                Authentication: "Bearer " + localStorage.getItem("token")
                            }
                        });
                        if (resp.status == 200) {
                            $('#showFreeIP').empty();
                            console.log("free ip is here!");
                            $('#btnToggleColapseFreeIP').removeClass('disabled').attr('aria-disabled', false);

                            let html = await resp.text();
                            $('#showFreeIP').append(html);
                        } else if (resp.status == 204) {
                            // нет свободных IP адресов - аккордеон не доступен
                            console.log("free ip resp.status == 204");
                            $('#btnToggleColapseFreeIP').addClass('disabled');
                            //$("#collapseFreeIP").addClass('collapse');
                        } else {
                            // если ошибка - показ тоста
                            showToast("Загрузка данных по IP адресам!", await resp.text(), true);
                        }
                    })();
                });
        })();
    })
}

function modalAssigningIP() {
    // автоматический выбор здания, в котором назначается IP адрес
    $(document).off('click', '.freeIP').on('click', '.freeIP', function (event) {
        ip = event.target.getAttribute("value")
        // console.log(ip)
        $('#formIPAddr').text(ip)
        var valAddr = $('select[name=chooseAddr]').val();
        if (valAddr != "all") {
            $('select[name=chooseAddrModal] option[value="' + valAddr + '"]').prop('selected', true);
        };
    });
}

function websocketListener() {
    let hostname = $(location).attr('host');
    let ulrWS = "ws://" + hostname + "/ws";
    console.log(ulrWS);
    let socket = new WebSocket(ulrWS);

    socket.onopen = function () {
        console.log("Соединение установлено.");
        socket.send("test");
    };

    socket.onclose = function (event) {
        if (event.wasClean) {
            console.log('Соединение закрыто чисто');
        } else {
            console.log('Обрыв соединения'); // например, "убит" процесс сервера
        }
        console.log('Код: ' + event.code + ' причина: ' + event.reason);
    };

    socket.onmessage = function (event) {
        console.log("Получены данные " + event.data);
        $.each(JSON.parse(event.data), function (index, obj) {
            // console.log("obj.name = " + obj.name);
            // console.log("obj.html = " + obj.html);
            $("td[nametd='" + obj.name + "']").html(obj.html);
        });
    };

    socket.onerror = function (error) {
        console.log("Ошибка " + error.message);
    };
}