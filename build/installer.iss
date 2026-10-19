; Установщик PomanRecorder (Inno Setup 6). Собирается через build\build.bat.
; Перед сборкой PyInstaller кладёт готовую программу в папку, путь к которой передаётся как /DAppSource=...

#define AppName "PomanRecorder"
#define AppVersion "1.0"
#define AppExe "PomanRecorder.exe"
#ifndef AppSource
  #define AppSource "..\dist\Recorder"
#endif

[Setup]
AppId={{63ACA532-C84E-4E93-863D-525486DD5D25}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppName}
AppComments=Запись звука с выбором микрофона, библиотека записей и эффекты
VersionInfoDescription=Установка программы {#AppName}
; Ставим для текущего пользователя — права администратора не нужны
PrivilegesRequired=lowest
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
DisableWelcomePage=no
DisableDirPage=yes
DisableReadyPage=yes
UninstallDisplayIcon={app}\{#AppExe}
UninstallDisplayName={#AppName}
SetupIconFile=icon.ico
WizardStyle=modern
WizardImageFile=wizard_large_1x.bmp,wizard_large_2x.bmp
WizardSmallImageFile=wizard_small_1x.bmp,wizard_small_2x.bmp
OutputDir=..\installer
OutputBaseFilename=PomanRecorder-Setup-{#AppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
; Если программа открыта, установщик попросит её закрыть (имя совпадает с мьютексом в recorder.py)
AppMutex=SimpleRecorder.SingleInstance
CloseApplications=yes

[Languages]
Name: "ru"; MessagesFile: "compiler:Languages\Russian.isl"

[Tasks]
Name: "desktopicon"; Description: "Создать ярлык на рабочем столе"; GroupDescription: "Ярлыки:"

[Files]
Source: "{#AppSource}\Recorder.exe"; DestDir: "{app}"; DestName: "{#AppExe}"; Flags: ignoreversion
Source: "{#AppSource}\_internal\*"; DestDir: "{app}\_internal"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExe}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExe}"; Description: "Запустить {#AppName}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}\_internal"

[Messages]
ru.WelcomeLabel2=Будет установлена программа [name/ver].%n%nЗапись звука с выбором микрофона, удобная библиотека записей, эффекты и быстрый доступ к файлам.%n%nЗаписи сохраняются в папку «Документы\PomanRecorder».
ru.FinishedLabel=Программа [name] установлена. Её можно запустить ярлыком на рабочем столе или из меню «Пуск».

[Code]
const
  WebView2Key = 'Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}';

function HasWebView2Key(Root: Integer; Key: String): Boolean;
var
  Version: String;
begin
  Result := RegQueryStringValue(Root, Key, 'pv', Version) and (Version <> '') and (Version <> '0.0.0.0');
end;

{ Окно программы рисуется движком Microsoft Edge WebView2. В Windows 11 он есть всегда,
  в Windows 10 обычно тоже, но не везде. Если его нет, скачиваем официальный установщик Microsoft и ставим сами. }
function WebView2Installed: Boolean;
begin
  Result := HasWebView2Key(HKLM, 'SOFTWARE\WOW6432Node\' + WebView2Key) or
            HasWebView2Key(HKLM, 'SOFTWARE\' + WebView2Key) or
            HasWebView2Key(HKCU, 'Software\' + WebView2Key);
end;

const
  WebView2Url = 'https://go.microsoft.com/fwlink/p/?LinkId=2124703';
  WebView2File = 'MicrosoftEdgeWebview2Setup.exe';

var
  DownloadPage: TDownloadWizardPage;
  WebView2Tried, WebView2Failed: Boolean;

{ Ключ /FORCEWEBVIEW2 — чтобы проверить установку WebView2 на компьютере, где он уже есть }
function NeedWebView2: Boolean;
begin
  Result := (Pos('/FORCEWEBVIEW2', Uppercase(GetCmdTail)) > 0) or not WebView2Installed;
end;

procedure InitializeWizard;
begin
  DownloadPage := CreateDownloadPage('Установка Microsoft Edge WebView2',
    'Программе нужен этот бесплатный компонент Microsoft. Он скачивается и ставится автоматически.', nil);
end;

function InstallWebView2(ShowPage: Boolean): Boolean;
var
  ResultCode: Integer;
begin
  Result := False;
  WebView2Tried := True;
  try
    if ShowPage then begin
      DownloadPage.Clear;
      DownloadPage.Add(WebView2Url, WebView2File, '');
      DownloadPage.Show;
      DownloadPage.Download;
      DownloadPage.SetText('Устанавливаю Microsoft Edge WebView2…', 'Это займёт около минуты.');
    end else
      DownloadTemporaryFile(WebView2Url, WebView2File, '', nil);
    Exec(ExpandConstant('{tmp}\') + WebView2File, '/silent /install', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Log(Format('WebView2 setup exit code: %d', [ResultCode]));
    Result := WebView2Installed;
  except
    Log('WebView2 install failed: ' + GetExceptionMessage);
  end;
  if ShowPage then
    DownloadPage.Hide;
end;

{ Обычная установка: страница задач — последняя перед копированием файлов }
function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if (CurPageID = wpSelectTasks) and (not WebView2Tried) and NeedWebView2 then
    WebView2Failed := not InstallWebView2(not WizardSilent);
end;

{ Запасной путь, если страницу задач пропустили (например, в тихой установке) }
function PrepareToInstall(var NeedsRestart: Boolean): String;
begin
  Result := '';
  if (not WebView2Tried) and NeedWebView2 then
    WebView2Failed := not InstallWebView2(False);
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ErrorCode: Integer;
begin
  if (CurStep = ssPostInstall) and WebView2Failed and (not WizardSilent) then
    if MsgBox('Не удалось автоматически установить компонент Microsoft Edge WebView2 (возможно, нет интернета).' + #13#10#13#10 +
              'Без него окно программы будет пустым. Открыть страницу загрузки Microsoft, чтобы установить его вручную?',
              mbConfirmation, MB_YESNO) = IDYES then
      ShellExec('open', WebView2Url, '', '', SW_SHOWNORMAL, ewNoWait, ErrorCode);
end;
