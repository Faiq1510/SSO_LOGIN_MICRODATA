<?php

namespace App\Http\Controllers;

use OpenApi\Annotations as OA;

/**
 * @OA\OpenApi(
 *     @OA\Info(
 *         title="API Sistem Kontrol Perumahan",
 *         version="1.0.0",
 *         description="Dokumentasi API untuk modul unit, material, gudang, progress, dan keuangan"
 *     ),
 *     @OA\Server(
 *         url="http://localhost",
 *         description="API Server"
 *     ),
 *     @OA\Components(
 *         @OA\SecurityScheme(
 *             securityScheme="sanctum",
 *             type="http",
 *             scheme="bearer"
 *         )
 *     )
 * )
 */
class SwaggerDefinitions
{
}
