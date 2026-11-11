<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

$casesDir = __DIR__ . '/assets/cases';
$configFile = $casesDir . '/cases_config.json';
$globalConfig = [];

if (file_exists($configFile)) {
    $configContent = file_get_contents($configFile);
    $decodedConfig = json_decode($configContent, true);
    if (is_array($decodedConfig)) {
        $globalConfig = $decodedConfig;
    }
}

$result = [];

if (is_dir($casesDir)) {
    $files = scandir($casesDir);
    if ($files !== false) {
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;
            
            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            if ($ext === 'xlsx' || $ext === 'xls') {
                $nameWithoutExt = pathinfo($file, PATHINFO_FILENAME);
                
                $caseConfig = isset($globalConfig[$file]) ? $globalConfig[$file] : null;
                $code = isset($caseConfig['code']) ? $caseConfig['code'] : $nameWithoutExt;
                
                $result[] = [
                    'filename' => $file,
                    'code' => $code,
                    'name' => isset($caseConfig['name']) ? $caseConfig['name'] : $nameWithoutExt,
                    'path' => 'assets/cases/' . $file,
                    'config' => $caseConfig
                ];
            }
        }
    }
}

// Sort cases naturally by name (e.g. Caso 1, Caso 2, Caso 10)
usort($result, function($a, $b) {
    return strnatcasecmp($a['name'], $b['name']);
});

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>
