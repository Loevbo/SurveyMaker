using SurveyMaker.Samples;
using Xunit;

namespace SurveyMaker.EntityFrameworkCore.Domains;

[Collection(SurveyMakerTestConsts.CollectionDefinitionName)]
public class EfCoreSampleDomainTests : SampleDomainTests<SurveyMakerEntityFrameworkCoreTestModule>
{

}
