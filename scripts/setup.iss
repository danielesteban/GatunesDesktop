#define MyAppName "Gatunes"
#define MyAppVersion "1.1.6"
#define MyAppPublisher "Gatunes S.L."
#define MyAppURL "http://gatunes.com/"
#define MyAppExeName "nw.exe"

[Setup]
AppId={{4C6CC31E-8AFC-4D5F-8D28-A68970FD5A91}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
;AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={pf}\{#MyAppName}
DefaultGroupName={#MyAppName}
OutputDir=.
OutputBaseFilename=Gatunes.v{#MyAppVersion}-win32
SetupIconFile=nw.ico
Compression=lzma
SolidCompression=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "nw.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "ffmpegsumo.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "icudt.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "libEGL.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "libGLESv2.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "nw.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "nw.pak"; DestDir: "{app}"; Flags: ignoreversion
Source: "package.nw"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\nw.ico"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\nw.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
