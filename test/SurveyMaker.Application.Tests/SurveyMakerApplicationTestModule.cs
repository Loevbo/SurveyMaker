using Volo.Abp.Modularity;

namespace SurveyMaker;

[DependsOn(
    typeof(SurveyMakerApplicationModule),
    typeof(SurveyMakerDomainTestModule)
)]
public class SurveyMakerApplicationTestModule : AbpModule
{

}
