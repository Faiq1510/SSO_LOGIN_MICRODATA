<?php

namespace Database\Seeders;

use App\Models\Material;
use Illuminate\Database\Seeder;

class MaterialSeeder extends Seeder
{
    public function run(): void
    {
        $materials = [
            ['kode_material'=>'MT001','nama_material'=>'Semen','satuan'=>'Zak','kategori'=>'Struktur'],
            ['kode_material'=>'MT002','nama_material'=>'Pasir Pasang','satuan'=>'Rit','kategori'=>'Struktur'],
            ['kode_material'=>'MT003','nama_material'=>'Pasir Cor','satuan'=>'Rit','kategori'=>'Struktur'],
            ['kode_material'=>'MT004','nama_material'=>'Bata Bolong','satuan'=>'Bh','kategori'=>'Dinding'],
            ['kode_material'=>'MT005','nama_material'=>'Split','satuan'=>'M3','kategori'=>'Struktur'],
            ['kode_material'=>'MT006','nama_material'=>'Besi 6','satuan'=>'Btg','kategori'=>'Struktur'],
            ['kode_material'=>'MT007','nama_material'=>'Besi 8','satuan'=>'Btg','kategori'=>'Struktur'],
            ['kode_material'=>'MT008','nama_material'=>'Paku 3','satuan'=>'Kg','kategori'=>'Struktur'],
            ['kode_material'=>'MT009','nama_material'=>'Paku 4','satuan'=>'Kg','kategori'=>'Struktur'],
            ['kode_material'=>'MT010','nama_material'=>'Kayu Kaso','satuan'=>'Btg','kategori'=>'Atap'],
            ['kode_material'=>'MT011','nama_material'=>'Kayu Balok','satuan'=>'Btg','kategori'=>'Atap'],
            ['kode_material'=>'MT012','nama_material'=>'Genteng','satuan'=>'Bh','kategori'=>'Atap'],
            ['kode_material'=>'MT013','nama_material'=>'Nok Genteng','satuan'=>'Bh','kategori'=>'Atap'],
            ['kode_material'=>'MT014','nama_material'=>'Keramik Lantai','satuan'=>'Dus','kategori'=>'Lantai'],
            ['kode_material'=>'MT015','nama_material'=>'Keramik Dinding','satuan'=>'Dus','kategori'=>'Dinding'],
            ['kode_material'=>'MT016','nama_material'=>'Semen Putih','satuan'=>'Zak','kategori'=>'Finishing'],
            ['kode_material'=>'MT017','nama_material'=>'Cat Tembok','satuan'=>'Pail','kategori'=>'Finishing'],
            ['kode_material'=>'MT018','nama_material'=>'Cat Dasar','satuan'=>'Pail','kategori'=>'Finishing'],
            ['kode_material'=>'MT019','nama_material'=>'Thinner','satuan'=>'Liter','kategori'=>'Finishing'],
            ['kode_material'=>'MT020','nama_material'=>'Plamir','satuan'=>'Kg','kategori'=>'Finishing'],
            ['kode_material'=>'MT021','nama_material'=>'Pipa PVC 1/2"','satuan'=>'Btg','kategori'=>'Plumbing'],
            ['kode_material'=>'MT022','nama_material'=>'Pipa PVC 3/4"','satuan'=>'Btg','kategori'=>'Plumbing'],
            ['kode_material'=>'MT023','nama_material'=>'Pipa PVC 1"','satuan'=>'Btg','kategori'=>'Plumbing'],
            ['kode_material'=>'MT024','nama_material'=>'Elbow PVC','satuan'=>'Bh','kategori'=>'Plumbing'],
            ['kode_material'=>'MT025','nama_material'=>'Tee PVC','satuan'=>'Bh','kategori'=>'Plumbing'],
            ['kode_material'=>'MT026','nama_material'=>'Kran Air','satuan'=>'Bh','kategori'=>'Plumbing'],
            ['kode_material'=>'MT027','nama_material'=>'Closet Duduk','satuan'=>'Unit','kategori'=>'Sanitary'],
            ['kode_material'=>'MT028','nama_material'=>'Wastafel','satuan'=>'Unit','kategori'=>'Sanitary'],
            ['kode_material'=>'MT029','nama_material'=>'Shower','satuan'=>'Set','kategori'=>'Sanitary'],
            ['kode_material'=>'MT030','nama_material'=>'Kabel NYM','satuan'=>'Roll','kategori'=>'Listrik'],
            ['kode_material'=>'MT031','nama_material'=>'Kabel NYA','satuan'=>'Roll','kategori'=>'Listrik'],
            ['kode_material'=>'MT032','nama_material'=>'Stop Kontak','satuan'=>'Bh','kategori'=>'Listrik'],
            ['kode_material'=>'MT033','nama_material'=>'Saklar','satuan'=>'Bh','kategori'=>'Listrik'],
            ['kode_material'=>'MT034','nama_material'=>'Lampu LED','satuan'=>'Bh','kategori'=>'Listrik'],
            ['kode_material'=>'MT035','nama_material'=>'MCB','satuan'=>'Bh','kategori'=>'Listrik'],
            ['kode_material'=>'MT036','nama_material'=>'Conduit PVC','satuan'=>'Btg','kategori'=>'Listrik'],
            ['kode_material'=>'MT037','nama_material'=>'Engsel Pintu','satuan'=>'Set','kategori'=>'Pintu'],
            ['kode_material'=>'MT038','nama_material'=>'Handle Pintu','satuan'=>'Set','kategori'=>'Pintu'],
            ['kode_material'=>'MT039','nama_material'=>'Kunci Pintu','satuan'=>'Set','kategori'=>'Pintu'],
            ['kode_material'=>'MT040','nama_material'=>'Pintu Panel','satuan'=>'Unit','kategori'=>'Pintu'],
            ['kode_material'=>'MT041','nama_material'=>'Jendela Aluminium','satuan'=>'Unit','kategori'=>'Jendela'],
            ['kode_material'=>'MT042','nama_material'=>'Kaca 5 mm','satuan'=>'Lbr','kategori'=>'Jendela'],
            ['kode_material'=>'MT043','nama_material'=>'Lis Aluminium','satuan'=>'Btg','kategori'=>'Jendela'],
            ['kode_material'=>'MT044','nama_material'=>'Triplek','satuan'=>'Lbr','kategori'=>'Interior'],
            ['kode_material'=>'MT045','nama_material'=>'Gypsum','satuan'=>'Lbr','kategori'=>'Plafon'],
            ['kode_material'=>'MT046','nama_material'=>'Rangka Hollow','satuan'=>'Btg','kategori'=>'Plafon'],
            ['kode_material'=>'MT047','nama_material'=>'Skrup Gypsum','satuan'=>'Box','kategori'=>'Plafon'],
            ['kode_material'=>'MT048','nama_material'=>'Lis Plafon','satuan'=>'Btg','kategori'=>'Plafon'],
            ['kode_material'=>'MT049','nama_material'=>'Waterproofing','satuan'=>'Pail','kategori'=>'Finishing'],
            ['kode_material'=>'MT050','nama_material'=>'Sealant','satuan'=>'Tube','kategori'=>'Finishing'],
            ['kode_material'=>'MT051','nama_material'=>'Batu Kali','satuan'=>'Rit','kategori'=>'Pondasi'],
            ['kode_material'=>'MT052','nama_material'=>'Urugan Tanah','satuan'=>'Rit','kategori'=>'Pondasi'],
            ['kode_material'=>'MT053','nama_material'=>'Kawat Bendrat','satuan'=>'Kg','kategori'=>'Struktur'],
            ['kode_material'=>'MT054','nama_material'=>'Wiremesh','satuan'=>'Lbr','kategori'=>'Struktur'],
            ['kode_material'=>'MT055','nama_material'=>'Hebel','satuan'=>'Bh','kategori'=>'Dinding'],
            ['kode_material'=>'MT056','nama_material'=>'Mortar Instan','satuan'=>'Zak','kategori'=>'Dinding'],
            ['kode_material'=>'MT057','nama_material'=>'Roster','satuan'=>'Bh','kategori'=>'Dinding'],
            ['kode_material'=>'MT058','nama_material'=>'Bekisting Papan','satuan'=>'Lbr','kategori'=>'Bekisting'],
            ['kode_material'=>'MT059','nama_material'=>'Paku Bekisting','satuan'=>'Kg','kategori'=>'Bekisting'],
            ['kode_material'=>'MT060','nama_material'=>'Kawat Ayam','satuan'=>'Roll','kategori'=>'Finishing'],
        ];

        foreach ($materials as $material) {
            $m = Material::updateOrCreate(
                ['kode_material' => $material['kode_material']],
                [
                    'nama_material' => $material['nama_material'],
                    'satuan'        => $material['satuan'],
                    'kategori'      => $material['kategori'],
                    'harga'         => 0,
                ]
            );

            // If harga is not set (0), assign a reasonable default based on category
            if ((float) $m->harga <= 0) {
                $kategori = $m->kategori ?? $material['kategori'];
                $default = match ($kategori) {
                    'Struktur' => rand(50_000, 150_000),
                    'Dinding'  => rand(10_000, 80_000),
                    'Atap'     => rand(30_000, 120_000),
                    'Finishing'=> rand(10_000, 60_000),
                    'Plumbing' => rand(20_000, 100_000),
                    'Listrik'  => rand(5_000, 50_000),
                    'Sanitary' => rand(100_000, 400_000),
                    'Pintu'    => rand(150_000, 600_000),
                    'Jendela'  => rand(100_000, 400_000),
                    'Lantai'   => rand(50_000, 250_000),
                    'Plafon'   => rand(20_000, 80_000),
                    'Pondasi'  => rand(30_000, 120_000),
                    default    => rand(5_000, 150_000),
                };

                $m->update(['harga' => $default]);
            }
        }
    }
}