' تشغيل نظام الإدارة المدرسية كنافذة سطح مكتب مستقلة دون ظهور شاشة موجه الأوامر السوداء
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.Run Chr(34) & strPath & "\SchoolSystem_App.bat" & Chr(34), 0, False
Set WshShell = Nothing
Set fso = Nothing
