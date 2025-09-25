using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace SurveyMaker.EntityFrameworkCore;

/* This class is needed for EF Core console commands
 * (like Add-Migration and Update-Database commands) */
public class SurveyMakerDbContextFactory : IDesignTimeDbContextFactory<SurveyMakerDbContext>
{
    public SurveyMakerDbContext CreateDbContext(string[] args)
    {
        var configuration = BuildConfiguration();
        
        SurveyMakerEfCoreEntityExtensionMappings.Configure();

        var builder = new DbContextOptionsBuilder<SurveyMakerDbContext>()
            .UseSqlServer(configuration.GetConnectionString("Default"));
        
        return new SurveyMakerDbContext(builder.Options);
    }

    private static IConfigurationRoot BuildConfiguration()
    {
        var builder = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), "../SurveyMaker.DbMigrator/"))
            .AddJsonFile("appsettings.json", optional: false);

        return builder.Build();
    }
}
