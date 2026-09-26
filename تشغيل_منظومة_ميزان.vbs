' تشغيل منظومة ميزان للإدارة المدرسية كنافذة سطح مكتب أنيقة بدون الشاشة السوداء
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.Run Chr(34) & strPath & "\تشغيل_منظومة_ميزان.bat" & Chr(34), 0, False
Set WshShell = Nothing
Set fso = Nothing
