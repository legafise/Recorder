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
  в Windows 10 почти всегда — но если нет, предложим скачать. }
function WebView2Installed: Boolean;
begin
  Result := HasWebView2Key(HKLM, 'SOFTWARE\WOW6432Node\' + WebView2Key) or
            HasWebView2Key(HKLM, 'SOFTWARE\' + WebView2Key) or
            HasWebView2Key(HKCU, 'Software\' + WebView2Key);
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ErrorCode: Integer;
begin
  if (CurStep = ssPostInstall) and (not WizardSilent) and (not WebView2Installed) then
    if MsgBox('Для работы программы нужен бесплатный компонент Microsoft Edge WebView2, а на этом компьютере его нет.' + #13#10#13#10 +
              'Открыть страницу загрузки Microsoft? Установите его, и программа заработает.',
              mbConfirmation, MB_YESNO) = IDYES then
      ShellExec('open', 'https://go.microsoft.com/fwlink/p/?LinkId=2124703', '', '', SW_SHOWNORMAL, ewNoWait, ErrorCode);
end;
