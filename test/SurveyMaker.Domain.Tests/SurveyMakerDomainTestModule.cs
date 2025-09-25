using Volo.Abp.Modularity;

namespace SurveyMaker;

[DependsOn(
    typeof(SurveyMakerDomainModule),
    typeof(SurveyMakerTestBaseModule)
)]
public class SurveyMakerDomainTestModule : AbpModule
{

}
