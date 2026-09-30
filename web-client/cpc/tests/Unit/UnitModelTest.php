<?php

namespace Tests\Unit;

use App\Models\Unit;
use PHPUnit\Framework\TestCase;

class UnitModelTest extends TestCase
{
    public function test_unit_code_attributes_are_normalized_and_truncated(): void
    {
        $unit = new Unit();

        $unit->nama_unit = 'ab12cd';
        $unit->zona = 'xyza';

        $this->assertSame('AB12', $unit->nama_unit);
        $this->assertSame('XY', $unit->zona);
    }
}
