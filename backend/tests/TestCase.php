<?php

namespace Tests;

use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Foundation\Testing\DatabaseTruncation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUpTraits()
    {
        if (array_intersect([RefreshDatabase::class, DatabaseMigrations::class, DatabaseTruncation::class], class_uses_recursive(static::class))) {
            $this->refuseRealDatabase();
        }

        return parent::setUpTraits();
    }

    /** Ces traits effacent la base : seul SQLite en mémoire y a droit, quelle que soit la configuration du poste. */
    protected function refuseRealDatabase(): void
    {
        $connection = config('database.default');
        $database = config("database.connections.{$connection}.database");

        if ($connection !== 'sqlite' || $database !== ':memory:') {
            throw new RuntimeException("Tests refusés : ils videraient la base {$connection}/{$database}. Il faut SQLite en mémoire (phpunit.xml).");
        }
    }
}
